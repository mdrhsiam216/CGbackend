import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsVerificationRepository } from '../repositories/sms-verification.repository';
import { SmsService } from '../../../shared/services/sms.service';
import { SmsOtpType } from '../entities/sms-verification.entity';
import { CustomLogger } from '../../../shared/services/custom-logger.service';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import {
  AuthErrorMessages,
  AuthLogMessages,
} from '../../../shared/enums/messages.enums';

@Injectable()
export class OtpService {
  private readonly otpExpiryMinutes: number;
  private readonly otpResendCooldownMinutes: number;

  constructor(
    private readonly smsOtpRepository: SmsVerificationRepository,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.otpExpiryMinutes = this.configService.get<number>(
      'OTP_EXPIRY_MINUTES',
      10,
    );
    this.otpResendCooldownMinutes = this.configService.get<number>(
      'OTP_RESEND_COOLDOWN_MINUTES',
      2,
    );
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP for phone verification
   */
  async sendVerificationOtp(
    phone: string,
    fullName: string,
    userId?: string,
  ): Promise<string> {
    // Check for recent OTP to prevent spam
    const recentOtp = await this.smsOtpRepository.findRecentOtp(
      phone,
      SmsOtpType.PHONE_VERIFICATION,
      this.otpResendCooldownMinutes,
    );

    if (recentOtp && !recentOtp.isUsed) {
      const timeSinceCreation =
        (Date.now() - recentOtp.createdAt.getTime()) / 1000 / 60;
      if (timeSinceCreation < this.otpResendCooldownMinutes) {
        const waitMinutes = Math.ceil(
          this.otpResendCooldownMinutes - timeSinceCreation,
        );
        throw new BadRequestException(
          AuthErrorMessages.OTP_RESEND_COOLDOWN.replace(
            '{minutes}',
            waitMinutes.toString(),
          ),
        );
      }
    }

    // Invalidate previous unused OTPs
    await this.smsOtpRepository.invalidateUserOtps(
      phone,
      SmsOtpType.PHONE_VERIFICATION,
    );

    // Generate new OTP
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);

    // Store OTP
    await this.smsOtpRepository.createVerification({
      phone,
      otp,
      otpType: SmsOtpType.PHONE_VERIFICATION,
      expiresAt,
      userId,
    });

    // Send SMS
    const sent = await this.smsService.sendOtpSms(phone, otp);

    if (!sent) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        AuthLogMessages.FAILED_TO_SEND_VERIFICATION_OTP_SMS,
        { phone },
      );
      throw new BadRequestException(
        AuthErrorMessages.FAILED_TO_SEND_VERIFICATION_SMS,
      );
    }

    this.logger.log(
      ServiceTags.AUTH_SERVICE,
      AuthLogMessages.PHONE_VERIFICATION_OTP_SENT,
      { phone },
    );

    return otp; // Return for testing purposes
  }

  /**
   * Verify phone OTP
   */
  async verifyOtp(
    phone: string,
    otp: string,
    otpType: SmsOtpType,
  ): Promise<boolean> {
    const verification = await this.smsOtpRepository.findActiveOtp(
      phone,
      otp,
      otpType,
    );

    if (!verification) {
      this.logger.warn(
        ServiceTags.AUTH_SERVICE,
        AuthLogMessages.INVALID_SMS_OTP_ATTEMPTED,
        { phone },
      );
      return false;
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      this.logger.warn(
        ServiceTags.AUTH_SERVICE,
        AuthLogMessages.EXPIRED_SMS_OTP_ATTEMPTED,
        { phone },
      );
      return false;
    }

    // Mark as used
    // await this.smsOtpRepository.markAsUsed(verification.id);

    this.logger.log(
      ServiceTags.AUTH_SERVICE,
      AuthLogMessages.PHONE_OTP_VERIFIED_SUCCESSFULLY,
      { phone, otpType },
    );

    return true;
  }

  /**
   * Send OTP for password reset via SMS
   */
  async sendPasswordResetOtp(
    phone: string,
    fullName: string,
    userId?: string,
  ): Promise<string> {
    // Check for recent OTP to prevent spam
    const recentOtp = await this.smsOtpRepository.findRecentOtp(
      phone,
      SmsOtpType.PASSWORD_RESET,
      this.otpResendCooldownMinutes,
    );

    if (recentOtp && !recentOtp.isUsed) {
      const timeSinceCreation =
        (Date.now() - recentOtp.createdAt.getTime()) / 1000 / 60;
      if (timeSinceCreation < this.otpResendCooldownMinutes) {
        const waitMinutes = Math.ceil(
          this.otpResendCooldownMinutes - timeSinceCreation,
        );
        throw new BadRequestException(
          AuthErrorMessages.OTP_RESEND_COOLDOWN.replace(
            '{minutes}',
            waitMinutes.toString(),
          ),
        );
      }
    }

    // Invalidate previous unused OTPs
    await this.smsOtpRepository.invalidateUserOtps(
      phone,
      SmsOtpType.PASSWORD_RESET,
    );

    // Generate new OTP
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);

    // Store OTP
    await this.smsOtpRepository.createVerification({
      phone,
      otp,
      otpType: SmsOtpType.PASSWORD_RESET,
      expiresAt,
      userId,
    });

    // Send SMS
    const sent = await this.smsService.sendPasswordResetSms(phone, otp);

    if (!sent) {
      this.logger.error(
        ServiceTags.AUTH_SERVICE,
        AuthLogMessages.FAILED_TO_SEND_PASSWORD_RESET_OTP_SMS,
        { phone },
      );
      throw new BadRequestException(
        AuthErrorMessages.FAILED_TO_SEND_PASSWORD_RESET_SMS,
      );
    }

    this.logger.log(
      ServiceTags.AUTH_SERVICE,
      AuthLogMessages.PASSWORD_RESET_OTP_SENT,
      { phone },
    );

    return otp; // Return for testing purposes
  }
}
