import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  SmsVerification,
  SmsOtpType,
} from '../entities/sms-verification.entity';

export interface ISmsVerificationRepository {
  createVerification(data: {
    phone: string;
    otp: string;
    otpType: SmsOtpType;
    expiresAt: Date;
    userId?: string;
  }): Promise<SmsVerification>;

  findActiveOtp(
    phone: string,
    otp: string,
    otpType: SmsOtpType,
  ): Promise<SmsVerification | null>;

  markAsUsed(id: string): Promise<void>;

  invalidateUserOtps(phone: string, otpType: SmsOtpType): Promise<void>;

  removeExpiredOtps(): Promise<number>;
}

@Injectable()
export class SmsVerificationRepository implements ISmsVerificationRepository {
  constructor(
    @InjectRepository(SmsVerification)
    private repository: Repository<SmsVerification>,
  ) {}

  async createVerification(data: {
    phone: string;
    otp: string;
    otpType: SmsOtpType;
    expiresAt: Date;
    userId?: string;
  }): Promise<SmsVerification> {
    const verification = this.repository.create(data);
    return this.repository.save(verification);
  }

  async findActiveOtp(
    phone: string,
    otp: string,
    otpType: SmsOtpType,
  ): Promise<SmsVerification | null> {
    return this.repository.findOne({
      where: {
        phone,
        otp,
        otpType,
        isUsed: false,
      },
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repository.update(id, { isUsed: true });
  }

  async invalidateUserOtps(phone: string, otpType: SmsOtpType): Promise<void> {
    await this.repository.update(
      {
        phone,
        otpType,
        isUsed: false,
      },
      { isUsed: true },
    );
  }

  async removeExpiredOtps(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async findRecentOtp(
    phone: string,
    otpType: SmsOtpType,
    minutesAgo: number = 2,
  ): Promise<SmsVerification | null> {
    const timeLimit = new Date();
    timeLimit.setMinutes(timeLimit.getMinutes() - minutesAgo);

    return this.repository.findOne({
      where: {
        phone,
        otpType,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
