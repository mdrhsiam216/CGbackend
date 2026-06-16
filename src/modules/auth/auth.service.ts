import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';
import { ClientProfile } from '../client-profile/entities/client-profile.entity';
import { CaregiverProfileRepository } from '../caregiver-profile/repositories/caregiver-profile.repository';
import { AddressResponseDto } from '../address/dto/response-address.dto';
import { JwtTokenService } from './services/jwt-token.service';
import { OtpService } from './services/otp.service';
import { LoginResponseDto } from './dto/create-auth.dto';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { plainToInstance } from 'class-transformer';
import { ResponseCaregiverProfileDto } from '../caregiver-profile/dto/response-caregiver-profile.dto';
import { ResponseClientProfileDto } from '../client-profile/dto/response-client-profile.dto';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import { SmsOtpType } from './entities/sms-verification.entity';
import {
  UserStatus,
  AuthErrorMessages,
  UserErrorMessages,
  UnauthorizedErrorMessages,
} from '../../shared/enums';
import type {
  IAuthService,
  IAuthSessionsRepository,
  AuthenticatedUser,
  TokenPair,
  LoginCredentials,
  LoginResponse,
  DeviceInfo,
  AuthSession,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IAuthSessionsRepository')
    private authSessionsRepository: IAuthSessionsRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(CaregiverProfile)
    private caregiverProfileRepository: Repository<CaregiverProfile>,
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    private caregiverProfileRepositoryService: CaregiverProfileRepository,
    private jwtTokenService: JwtTokenService,
    private otpService: OtpService,
    private logger: CustomLogger,
  ) {}

  /**
   * Validate user credentials for login
   * Supports login with either email or phone number
   */
  async validateUser(
    emailOrPhone: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Validating user credentials for: ${emailOrPhone}`,
      );

      // Determine if input is email or phone by checking for @ symbol
      const isEmail = emailOrPhone.includes('@');
      const whereCondition = isEmail
        ? { email: emailOrPhone }
        : { phone: emailOrPhone };

      const user = await this.userRepository.findOne({
        where: whereCondition,
        select: ['id', 'email', 'phone', 'password', 'status'],
      });

      if (!user) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `User not found for ${isEmail ? 'email' : 'phone'}: ${emailOrPhone}`,
        );
        return null;
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Inactive user attempted login: ${emailOrPhone}`,
          { status: user.status, expectedStatus: UserStatus.ACTIVE },
        );
        throw new BadRequestException(
          UnauthorizedErrorMessages.ACCOUNT_INACTIVE,
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Invalid password for user: ${emailOrPhone}`,
        );
        return null;
      }

      // Get user roles
      const userRoles = await this.userRoleRepository.find({
        where: { user: { id: user.id } },
        relations: ['role'],
      });

      const roles = userRoles.map((ur) => ur.role.name);

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `User validation successful for: ${emailOrPhone}`,
        { userId: user.id, email: user.email, roles },
      );

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roles,
      };
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Error validating user: ${emailOrPhone}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Login user and create session
   * Supports login with either email or phone number
   */
  async login(
    credentials: LoginCredentials,
    deviceInfo: DeviceInfo,
  ): Promise<LoginResponse> {
    try {
      // Determine login identifier (email or phone)
      const loginIdentifier = credentials.email || credentials.phone;
      if (!loginIdentifier) {
        throw new BadRequestException(
          AuthErrorMessages.EMAIL_OR_PHONE_REQUIRED,
        );
      }

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Login attempt for: ${loginIdentifier}`,
        {
          ipAddress: deviceInfo.ipAddress,
          deviceName: deviceInfo.deviceName,
          loginType: credentials.email ? 'email' : 'phone',
        },
      );

      const user = await this.validateUser(
        loginIdentifier,
        credentials.password,
      );

      if (!user) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Failed login attempt for: ${loginIdentifier}`,
        );
        throw new UnauthorizedException(UserErrorMessages.INVALID_CREDENTIALS);
      }

      // Get user roles from database
      const userRoles = await this.userRoleRepository.find({
        where: { user: { id: user.id } },
        relations: ['role'],
      });

      if (!userRoles || userRoles.length === 0) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `User has no roles assigned: ${user.id}`,
        );
        throw new UnauthorizedException(
          UnauthorizedErrorMessages.USER_HAS_NO_ROLES,
        );
      }

      const userRoleNames = userRoles.map((ur) => ur.role.name);

      // Role handling is simple: we always use the requested roleId from the login DTO
      // to determine which profile to return.
      // 1. Validate that the requested role exists in the roles table
      // 2. Validate that the user actually has that role assigned
      // 3. Use the matched role.name to decide which profile to load
      if (!credentials.roleId) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Login attempt without roleId for user: ${user.id}`,
        );
        throw new BadRequestException('Role ID is required for login');
      }

      const requestedRole = await this.roleRepository.findOne({
        where: { id: credentials.roleId },
      });

      if (!requestedRole) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Role not found: ${credentials.roleId}`,
        );
        throw new NotFoundException(UnauthorizedErrorMessages.ROLE_NOT_FOUND);
      }

      const userHasRole = userRoles.some(
        (ur) => ur.role.id === credentials.roleId,
      );

      if (!userHasRole) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `User ${user.id} attempted to login with role ${credentials.roleId} but does not have this role`,
          {
            userId: user.id,
            requestedRoleId: credentials.roleId,
            requestedRoleName: requestedRole.name,
            userRoles: userRoles.map((ur) => ({
              id: ur.role.id,
              name: ur.role.name,
            })),
          },
        );
        throw new UnauthorizedException(
          UnauthorizedErrorMessages.USER_DOES_NOT_HAVE_ROLE,
        );
      }

      const roleName = requestedRole.name.toLowerCase();

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Role validation successful for user: ${user.id}`,
        {
          requestedRoleId: credentials.roleId,
          requestedRoleName: requestedRole.name,
        },
      );

      // Generate tokens
      const tokens = this.jwtTokenService.generateTokenPair(user);

      // Create refresh token session using repository
      const savedSession = await this.authSessionsRepository.createSession({
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: this.jwtTokenService.getRefreshTokenExpiry(),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceName: deviceInfo.deviceName,
      });

      // Load profile and address data based on role
      let caregiverProfile: ResponseCaregiverProfileDto | undefined = undefined;
      let clientProfile: ResponseClientProfileDto | undefined = undefined;
      let addresses: AddressResponseDto[] | undefined = undefined;

      if (roleName === 'caregiver') {
        const fullUser = await this.userRepository.findOne({
          where: { id: user.id },
          relations: [
            'caregiverProfile',
            'caregiverProfile.user',
            'caregiverProfile.certificates',
            'caregiverProfile.availabilitySlots',
            'addresses',
          ],
        });
        if (fullUser?.caregiverProfile) {
          // Get review stats for caregiver profile
          const reviewStats =
            await this.caregiverProfileRepositoryService.getReviewStats(
              fullUser.caregiverProfile.id,
            );
          const profileData = {
            ...fullUser.caregiverProfile,
            averageRating: reviewStats.averageRating,
            totalReviews: reviewStats.totalReviews,
          };
          caregiverProfile = plainToInstance(
            ResponseCaregiverProfileDto,
            profileData,
            {
              excludeExtraneousValues: true,
            },
          );
        }

        if (fullUser?.addresses?.length) {
          addresses = fullUser.addresses.map((address) =>
            plainToInstance(AddressResponseDto, address, {
              excludeExtraneousValues: true,
            }),
          );
        }
      } else if (roleName === 'client') {
        const fullUser = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['clientProfile', 'clientProfile.user', 'addresses'],
        });
        if (fullUser?.clientProfile) {
          clientProfile = plainToInstance(
            ResponseClientProfileDto,
            fullUser.clientProfile,
            {
              excludeExtraneousValues: true,
            },
          );
        }

        if (fullUser?.addresses?.length) {
          addresses = fullUser.addresses.map((address) =>
            plainToInstance(AddressResponseDto, address, {
              excludeExtraneousValues: true,
            }),
          );
        }
      } else {
        // Non client/caregiver roles (e.g., admin) – still load addresses
        const fullUser = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['addresses'],
        });

        if (fullUser?.addresses?.length) {
          addresses = fullUser.addresses.map((address) =>
            plainToInstance(AddressResponseDto, address, {
              excludeExtraneousValues: true,
            }),
          );
        }
      }

      const response: LoginResponseDto = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        roles: userRoleNames,
        message: 'Login successful',
        caregiverProfile: caregiverProfile || undefined,
        clientProfile: clientProfile || undefined,
        addresses: addresses || undefined,
      };

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Successful login for user: ${user.email}`,
        {
          userId: user.id,
          sessionId: savedSession.id,
          roles: user.roles,
        },
      );

      return {
        user: response,
        tokens,
        sessionId: savedSession.id,
      };
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Login error for email: ${credentials.email}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      this.logger.log(ServiceTags.AUTH_SERVICE, 'Token refresh attempt');

      // Verify refresh token
      let payload;
      try {
        payload = this.jwtTokenService.verifyRefreshToken(refreshToken);
      } catch (error) {
        this.logger.error(
          ServiceTags.AUTH_SERVICE,
          'Invalid refresh token provided',
          error,
        );
        throw new UnauthorizedException(
          UnauthorizedErrorMessages.INVALID_REFRESH_TOKEN,
        );
      }

      // Find active session using repository
      const authSession =
        await this.authSessionsRepository.findSessionByToken(refreshToken);

      if (
        !authSession ||
        authSession.expiresAt < new Date() ||
        authSession.userId !== payload.sub
      ) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          'Refresh token expired or invalid',
          {
            sessionExists: !!authSession,
            expired: authSession ? authSession.expiresAt < new Date() : null,
            userIdMatch: authSession
              ? authSession.userId === payload.sub
              : null,
          },
        );
        throw new UnauthorizedException(
          UnauthorizedErrorMessages.INVALID_REFRESH_TOKEN,
        );
      }

      // Get user information and roles
      const user = await this.userRepository.findOne({
        where: { id: authSession.userId },
      });

      if (!user) {
        this.logger.error(
          ServiceTags.AUTH_SERVICE,
          `User not found for refresh token`,
          { userId: authSession.userId },
        );
        throw new UnauthorizedException(UserErrorMessages.USER_NOT_FOUND);
      }

      const userRoles = await this.userRoleRepository.find({
        where: { user: { id: authSession.userId } },
        relations: ['role'],
      });

      const roles = userRoles.map((ur) => ur.role.name);

      // Generate new tokens
      const newTokens = this.jwtTokenService.generateTokenPair({
        id: user.id,
        email: user.email,
        roles,
      });

      // Create new session with updated token (deactivate old, create new)
      await this.authSessionsRepository.deactivateSession(refreshToken);
      await this.authSessionsRepository.createSession({
        userId: user.id,
        refreshToken: newTokens.refreshToken,
        expiresAt: this.jwtTokenService.getRefreshTokenExpiry(),
        ipAddress: authSession.ipAddress,
        userAgent: authSession.userAgent,
        deviceName: authSession.deviceName,
      });

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Token refresh successful for user: ${user.email}`,
        { userId: user.id },
      );

      return newTokens;
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        'Token refresh failed',
        error,
      );
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      this.logger.log(ServiceTags.AUTH_SERVICE, 'User logout initiated');

      await this.authSessionsRepository.deactivateSession(refreshToken);

      this.logger.log(ServiceTags.AUTH_SERVICE, 'User logout successful');
    } catch (error) {
      this.logger.error(ServiceTags.AUTH_SERVICE, 'Logout failed', error);
      throw error;
    }
  }

  /**
   * Logout from all devices (invalidate all sessions)
   */
  async logoutAllDevices(userId: string): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Logout all devices initiated for user: ${userId}`,
      );

      await this.authSessionsRepository.deactivateAllUserSessions(userId);

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Logout all devices successful for user: ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Logout all devices failed for user: ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's active sessions
   */
  async getActiveSessions(userId: string): Promise<AuthSession[]> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Retrieving active sessions for user: ${userId}`,
      );

      const sessions = await this.authSessionsRepository.findSessionsByUserId(
        userId,
        false,
      );

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Retrieved ${sessions.length} active sessions for user: ${userId}`,
      );

      return sessions;
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Failed to get active sessions for user: ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (run as scheduled job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        'Cleanup expired sessions initiated',
      );

      const removedCount =
        await this.authSessionsRepository.removeExpiredSessions();

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Cleanup expired sessions completed, removed ${removedCount} sessions`,
      );

      return removedCount;
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        'Cleanup expired sessions failed',
        error,
      );
      throw error;
    }
  }

  /**
   * Register a new user
   * Creates user first, then sends OTP. If OTP fails, deletes the user.
   */
  async register(createUserDto: {
    email: string;
    password: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    emergencyContacts?: any;
  }): Promise<{
    id: string;
    email: string;
    phone: string;
    message: string;
  }> {
    let createdUserId: string | null = null;

    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Starting user registration for email: ${createUserDto.email}`,
      );

      // Check for existing user
      const existingUser = await this.userRepository.findOne({
        where: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
      });

      if (existingUser) {
        if (existingUser.email === createUserDto.email) {
          throw new ConflictException(UserErrorMessages.EMAIL_ALREADY_EXISTS);
        }
        if (existingUser.phone === createUserDto.phone) {
          throw new ConflictException(UserErrorMessages.PHONE_ALREADY_EXISTS);
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user (commits immediately)
      const user = this.userRepository.create({
        email: createUserDto.email,
        password: hashedPassword,
        phone: createUserDto.phone,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        status: UserStatus.PENDING,
        emergencyContacts: createUserDto.emergencyContacts,
      });

      const savedUser = await this.userRepository.save(user);
      createdUserId = savedUser.id;

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `User created: ${savedUser.id}`,
      );

      // Try to send OTP - if this fails, delete the user
      try {
        const userName =
          savedUser.firstName && savedUser.lastName
            ? `${savedUser.firstName} ${savedUser.lastName}`
            : savedUser.firstName || savedUser.lastName || 'User';
        await this.otpService.sendVerificationOtp(
          savedUser.phone,
          userName,
          savedUser.id,
        );

        this.logger.log(
          ServiceTags.AUTH_SERVICE,
          `OTP sent successfully for user: ${savedUser.id}`,
        );
      } catch (otpError) {
        this.logger.error(
          ServiceTags.AUTH_SERVICE,
          `OTP sending failed for user: ${savedUser.id}, deleting user`,
          otpError,
        );

        // Delete the user if OTP sending fails
        try {
          await this.userRepository.remove(savedUser);
          this.logger.log(
            ServiceTags.AUTH_SERVICE,
            `User deleted due to OTP failure: ${savedUser.id}`,
          );
        } catch (deleteError) {
          this.logger.error(
            ServiceTags.AUTH_SERVICE,
            `Failed to delete user after OTP failure: ${savedUser.id}`,
            deleteError,
          );
          // Continue to throw the original OTP error
        }

        throw new InternalServerErrorException(
          AuthErrorMessages.FAILED_TO_SEND_VERIFICATION_OTP,
        );
      }

      // Assign role if provided and auto-create client profile when role is client
      if (createUserDto.roleId) {
        try {
          const role = await this.roleRepository.findOne({
            where: { id: createUserDto.roleId },
          });

          if (role) {
            const userRole = this.userRoleRepository.create({
              user: savedUser,
              role: role,
            });
            await this.userRoleRepository.save(userRole);

            this.logger.log(
              ServiceTags.AUTH_SERVICE,
              `Role assigned to user: ${savedUser.id}, Role: ${role.name} (${role.id})`,
            );

            // If the assigned role is 'client', automatically create a client profile
            if (role.name.toLowerCase() === 'client') {
              const existingClientProfile =
                await this.clientProfileRepository.findOne({
                  where: { user: { id: savedUser.id } },
                });

              if (!existingClientProfile) {
                const clientProfile = this.clientProfileRepository.create({
                  user: savedUser,
                });
                await this.clientProfileRepository.save(clientProfile);

                this.logger.log(
                  ServiceTags.AUTH_SERVICE,
                  `Client profile created for user: ${savedUser.id}`,
                );
              }
            }
          } else {
            this.logger.warn(
              ServiceTags.AUTH_SERVICE,
              `Role not found with ID: ${createUserDto.roleId}, skipping assignment for user: ${savedUser.id}`,
            );
          }
        } catch (roleError) {
          // Log but don't fail registration if role assignment or client profile creation fails
          this.logger.warn(
            ServiceTags.AUTH_SERVICE,
            `Role assignment or client profile creation failed for user: ${savedUser.id}, but user was created successfully`,
            roleError,
          );
        }
      }

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `User registration completed successfully: ${savedUser.id}`,
      );

      return {
        id: savedUser.id,
        email: savedUser.email,
        phone: savedUser.phone,
        message:
          'Registration successful. Please check your phone for the verification OTP.',
      };
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `User registration failed for email: ${createUserDto.email}`,
        error,
      );

      // If user was created but something else failed, try to clean up
      if (createdUserId && !(error instanceof ConflictException)) {
        try {
          const userToDelete = await this.userRepository.findOne({
            where: { id: createdUserId },
          });
          if (userToDelete) {
            await this.userRepository.remove(userToDelete);
            this.logger.log(
              ServiceTags.AUTH_SERVICE,
              `Cleaned up user after registration failure: ${createdUserId}`,
            );
          }
        } catch (cleanupError) {
          this.logger.error(
            ServiceTags.AUTH_SERVICE,
            `Failed to cleanup user after registration failure: ${createdUserId}`,
            cleanupError,
          );
        }
      }

      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new InternalServerErrorException(
        UserErrorMessages.USER_CREATION_FAILED,
      );
    }
  }

  async verifyOtp(phone: string, otp: string): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Phone verification attempt for: ${phone}`,
      );

      const isValid = await this.otpService.verifyOtp(
        phone,
        otp,
        SmsOtpType.PHONE_VERIFICATION,
      );

      if (!isValid) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Invalid or expired OTP for phone: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.INVALID_OTP);
      }

      // Find user and activate account
      const user = await this.userRepository.findOne({
        where: { phone },
      });

      if (!user) {
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      if (user.status === UserStatus.ACTIVE) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `User account already active for phone: ${phone}`,
        );
        // If phone is not verified, verify it, but don't throw error
        if (!user.phoneVerified) {
          user.phoneVerified = true;
          await this.userRepository.save(user);
        }
        return; // Exit gracefully
      }

      // Mark phone as verified and activate user account
      // Use update method to ensure the status is properly saved
      await this.userRepository.update(user.id, {
        phoneVerified: true,
        status: UserStatus.ACTIVE,
      });

      // Reload user to verify the update was successful
      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
        select: ['id', 'status', 'phoneVerified'],
      });

      if (!updatedUser || updatedUser.status !== UserStatus.ACTIVE) {
        this.logger.error(
          ServiceTags.AUTH_SERVICE,
          `Failed to activate user account: ${phone}`,
          {
            userId: user.id,
            savedStatus: updatedUser?.status,
            phoneVerified: updatedUser?.phoneVerified,
          },
        );
        throw new InternalServerErrorException(
          AuthErrorMessages.FAILED_TO_ACTIVATE_ACCOUNT,
        );
      }

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Phone verified and account activated for: ${phone}`,
        {
          userId: user.id,
          status: updatedUser.status,
          phoneVerified: updatedUser.phoneVerified,
        },
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Phone verification failed for: ${phone}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verify password reset OTP (used after forgot-password, before reset-password).
   * Validates the OTP sent to the user's phone so the frontend can show the reset-password form.
   */
  async verifyResetOtp(phone: string, otp: string): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset OTP verification attempt for: ${phone}`,
      );

      const isValid = await this.otpService.verifyOtp(
        phone,
        otp,
        SmsOtpType.PASSWORD_RESET,
      );

      if (!isValid) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Invalid or expired password reset OTP for phone: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.INVALID_OTP);
      }

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset OTP verified for: ${phone}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Password reset OTP verification failed for: ${phone}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Request password reset OTP via SMS
   */
  async requestPasswordReset(phone: string): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset requested for phone: ${phone}`,
      );

      // Find user by phone number
      const user = await this.userRepository.findOne({
        where: { phone },
        select: [
          'id',
          'email',
          'phone',
          'firstName',
          'lastName',
          'status',
          'phoneVerified',
        ],
      });

      if (!user) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset requested for non-existent phone: ${phone}`,
        );
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      // Check if account is active
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset requested for inactive account: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.ACCOUNT_NOT_ACTIVE);
      }

      // Check if phone is verified (recommended for security)
      if (!user.phoneVerified) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset requested for unverified phone: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.PHONE_NOT_VERIFIED);
      }

      // Send password reset OTP via SMS
      const userName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || 'User';
      await this.otpService.sendPasswordResetOtp(user.phone, userName, user.id);

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset OTP sent to: ${user.phone} for user: ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Password reset request failed for phone: ${phone}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reset password with OTP verification via SMS
   */
  async resetPassword(
    phone: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset attempt for phone: ${phone}`,
      );

      // Find user by phone number
      const user = await this.userRepository.findOne({
        where: { phone },
        select: ['id', 'email', 'phone', 'password', 'status', 'phoneVerified'],
      });

      if (!user) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset attempted for non-existent phone: ${phone}`,
        );
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      // Check if account is active
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset attempted for inactive account: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.ACCOUNT_NOT_ACTIVE);
      }

      // Check if phone is verified (recommended for security)
      if (!user.phoneVerified) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Password reset attempted for unverified phone: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.PHONE_NOT_VERIFIED);
      }

      // Verify OTP
      const isValid = await this.otpService.verifyOtp(
        phone,
        otp,
        SmsOtpType.PASSWORD_RESET,
      );

      if (!isValid) {
        this.logger.warn(
          ServiceTags.AUTH_SERVICE,
          `Invalid or expired OTP for password reset: ${phone}`,
        );
        throw new BadRequestException(AuthErrorMessages.INVALID_OTP);
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await this.userRepository.save(user);

      this.logger.log(
        ServiceTags.AUTH_SERVICE,
        `Password reset successful for phone: ${phone}`,
        { userId: user.id, email: user.email },
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        `Password reset failed for phone: ${phone}`,
        error,
      );
      throw error;
    }
  }
}
