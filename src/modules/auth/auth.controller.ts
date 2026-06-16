import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
} from './dto/create-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  AuthSuccessMessages,
  AuthOperationSummaries,
  AuthResponseMessages,
  ApiResponseDescriptions,
  AuthApiResponseDescriptions,
} from '../../shared/enums';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import {
  VerifySmsOtpDto,
  SendSmsOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/otp.dto';
import { OtpService } from './services/otp.service';
import type {
  DeviceInfo,
  LoginCredentials,
  TokenPair,
  JwtUser,
  AuthSession,
} from './interfaces/auth.interface';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.LOGIN_SUCCESSFUL)
  @ApiOperation({ summary: AuthOperationSummaries.LOGIN })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.LOGIN_SUCCESSFUL,
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.INVALID_CREDENTIALS,
  })
  @ApiResponse({
    status: 400,
    description: ApiResponseDescriptions.BAD_REQUEST,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // Validate that either email or phone is provided
    if (!loginDto.email && !loginDto.phone) {
      throw new UnauthorizedException(
        'Either email or phone number is required for login',
      );
    }

    const deviceInfo: DeviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      deviceName: req.get('x-device-name') || 'Unknown Device',
    };

    const credentials: LoginCredentials = {
      email: loginDto.email,
      phone: loginDto.phone,
      password: loginDto.password,
      roleId: loginDto.roleId,
    };

    const { user, tokens, sessionId } = await this.authService.login(
      credentials,
      deviceInfo,
    );
    this.setSecureCookies(res, tokens, sessionId);

    return {
      ...user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Register a new user, creates user with pending status and sends SMS OTP
   * Uses transaction to ensure user is only created if OTP sending succeeds
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(AuthSuccessMessages.USER_REGISTERED_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.REGISTER })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: AuthSuccessMessages.USER_REGISTERED_SUCCESSFULLY,
  })
  @ApiResponse({
    status: 400,
    description: AuthApiResponseDescriptions.USER_ALREADY_EXISTS,
  })
  @ApiResponse({
    status: 409,
    description: ApiResponseDescriptions.EMAIL_ALREADY_IN_USE,
  })
  async register(@Body() createUserDto: CreateUserDto) {
    // Use AuthService.register which handles transaction and OTP sending atomically
    return await this.authService.register({
      email: createUserDto.email,
      password: createUserDto.password,
      phone: createUserDto.phone,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      roleId: createUserDto.roleId,
      emergencyContacts: createUserDto.emergencyContacts,
    });
  }

  /**
   * Verify phone OTP and activate account
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.PHONE_VERIFIED_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.VERIFY_OTP })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.PHONE_VERIFIED_SUCCESSFULLY,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.PHONE_VERIFIED,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: AuthApiResponseDescriptions.INVALID_OTP,
  })
  async verifyOtp(@Body() verifySmsOtpDto: VerifySmsOtpDto) {
    await this.authService.verifyOtp(
      verifySmsOtpDto.phone,
      verifySmsOtpDto.otp,
    );
    return {
      message: 'Phone verified successfully. Your account is now active.',
    };
  }

  /**
   * Request a new verification OTP (independent endpoint)
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.VERIFICATION_OTP_SENT_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.REQUEST_OTP })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.VERIFICATION_OTP_SENT_SUCCESSFULLY,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.VERIFICATION_OTP_SENT,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  async requestVerificationOtp(@Body() body: SendSmsOtpDto) {
    const user = await this.userService.findByPhone(body.phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'User';
    await this.otpService.sendVerificationOtp(body.phone, userName, user.id);

    return { message: 'Verification OTP sent to your phone successfully' };
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.VERIFICATION_OTP_SENT_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.RESEND_OTP })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.VERIFICATION_OTP_SENT_SUCCESSFULLY,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.VERIFICATION_OTP_SENT,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  async resendVerificationOtp(@Body() body: SendSmsOtpDto) {
    const user = await this.userService.findByPhone(body.phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'User';
    await this.otpService.sendVerificationOtp(body.phone, userName, user.id);

    return { message: 'Verification OTP sent to your phone successfully' };
  }

  /**
   * Request password reset (sends OTP via SMS)
   * Requires phone number instead of email
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.PASSWORD_RESET_OTP_SENT)
  @ApiOperation({ summary: AuthOperationSummaries.FORGOT_PASSWORD })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.PASSWORD_RESET_OTP_SENT,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.PASSWORD_RESET_OTP_SENT,
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(forgotPasswordDto.phone);
    return {
      message:
        'If a user with that phone number exists, a password reset OTP has been sent via SMS.',
    };
  }

  /**
   * Verify password reset OTP (after forgot-password, before reset-password).
   * Same body as verify-otp: { phone, otp }. Use this in the forgot-password flow.
   */
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.PHONE_VERIFIED_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.VERIFY_RESET_OTP })
  @ApiBody({ type: VerifySmsOtpDto })
  @ApiResponse({
    status: 200,
    description:
      'Password reset OTP verified; user can proceed to reset password',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'OTP verified. You can now reset your password.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: AuthApiResponseDescriptions.INVALID_OTP,
  })
  async verifyResetOtp(@Body() verifySmsOtpDto: VerifySmsOtpDto) {
    await this.authService.verifyResetOtp(
      verifySmsOtpDto.phone,
      verifySmsOtpDto.otp,
    );
    return {
      message: 'OTP verified. You can now reset your password.',
    };
  }

  /**
   * Reset password with OTP verification via SMS
   * Requires phone number instead of email
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.PASSWORD_RESET_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.RESET_PASSWORD })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.PASSWORD_RESET_SUCCESSFULLY,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.PASSWORD_RESET,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: AuthApiResponseDescriptions.INVALID_OTP_OR_PASSWORD,
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.phone,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }

  /**
   * Refresh tokens endpoint
   * Uses refresh token from request body
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AuthSuccessMessages.TOKENS_REFRESHED_SUCCESSFULLY)
  @ApiOperation({ summary: AuthOperationSummaries.REFRESH_TOKEN })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.TOKENS_REFRESHED_SUCCESSFULLY,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.TOKENS_REFRESHED,
        },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.INVALID_REFRESH_TOKEN,
  })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    // Update cookies with new tokens (if cookies are still being used for other endpoints)
    this.setTokenCookies(res, tokens);

    return {
      message: 'Tokens refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout endpoint
   * Clears cookies and invalidates session
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(AuthSuccessMessages.LOGOUT_SUCCESSFUL)
  @ApiBearerAuth()
  @ApiOperation({ summary: AuthOperationSummaries.LOGOUT })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.LOGOUT_SUCCESSFUL,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: AuthResponseMessages.LOGOUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear all auth cookies
    this.clearAuthCookies(res);

    return { message: 'Logout successful' };
  }

  /**
   * Logout from all devices
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(AuthSuccessMessages.LOGGED_OUT_FROM_ALL_DEVICES)
  @ApiBearerAuth()
  @ApiOperation({ summary: AuthOperationSummaries.LOGOUT_ALL })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.LOGGED_OUT_FROM_ALL_DEVICES,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: AuthResponseMessages.LOGGED_OUT_ALL_DEVICES,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async logoutAllDevices(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAllDevices(user.userId);

    // Clear cookies for current session
    this.clearAuthCookies(res);

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(AuthSuccessMessages.PROFILE_RETRIEVED_SUCCESSFULLY)
  @ApiBearerAuth()
  @ApiOperation({ summary: AuthOperationSummaries.GET_PROFILE })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.PROFILE_RETRIEVED_SUCCESSFULLY,
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async getProfile(@CurrentUser() user: JwtUser): Promise<ProfileResponseDto> {
    const fullUser = await this.userService.findEntityById(user.userId);
    console.log('Full User:', JSON.stringify(fullUser, null, 2));
    console.log('Emergency Contacts:', fullUser.emergencyContacts);

    // Determine profile data (Client or Caregiver)
    const profile = fullUser.clientProfile || fullUser.caregiverProfile || {};
    const address =
      fullUser.addresses?.find((a) => a.isDefault) ||
      fullUser.addresses?.[0] ||
      {};

    return {
      firstName: (profile as any).firstName || fullUser.firstName || '',
      lastName: (profile as any).lastName || fullUser.lastName || '',
      primaryPhone: fullUser.phone,
      email: fullUser.email,
      dateOfBirth: (profile as any).dateOfBirth || null,
      gender: (profile as any).gender || 'Male',
      addressLine1: address.streetAddress || '',
      addressLine2: address.apartment || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.postalCode || '',
      emergencyContacts: fullUser.emergencyContacts,
    };
  }

  /**
   * Get active sessions for current user
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(AuthSuccessMessages.ACTIVE_SESSIONS_RETRIEVED)
  @ApiBearerAuth()
  @ApiOperation({ summary: AuthOperationSummaries.GET_SESSIONS })
  @ApiResponse({
    status: 200,
    description: AuthSuccessMessages.ACTIVE_SESSIONS_RETRIEVED,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          deviceName: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' },
          lastActive: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async getActiveSessions(
    @CurrentUser() user: JwtUser,
  ): Promise<AuthSession[]> {
    return this.authService.getActiveSessions(user.userId);
  }

  /**
   * Set secure httpOnly cookies for authentication
   */
  private setSecureCookies(
    res: Response,
    tokens: TokenPair,
    sessionId: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie (shorter expiry)
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh token cookie (longer expiry)
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Session ID for additional security
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Set only token cookies (for refresh endpoint)
   */
  private setTokenCookies(res: Response, tokens: TokenPair): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Clear all authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    res.clearCookie('session_id', cookieOptions);
  }
}
