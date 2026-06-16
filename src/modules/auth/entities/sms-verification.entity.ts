import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum SmsOtpType {
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
}

@Entity('sms_verifications')
@Index(['phone', 'otpType', 'isUsed'])
@Index(['phone', 'otp', 'isUsed', 'expiresAt'])
export class SmsVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Column({
    type: 'enum',
    enum: SmsOtpType,
    default: SmsOtpType.PHONE_VERIFICATION,
  })
  otpType: SmsOtpType;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Optional relationship to user (may not exist during registration)
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;
}
