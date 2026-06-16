import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Transaction,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CaregiverProfile } from 'src/modules/caregiver-profile/entities/caregiver-profile.entity';
import { Payment } from 'src/modules/SSL_Commerce/entity/SSL_payment.entity';
import { Address } from '../../address/entities/address.entity';
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar', length: 100, nullable: false })
  serviceType: string;
  @Column({ type: 'date', nullable: false })
  date: string;
  @Column({ type: 'time', nullable: false })
  startTime: string;
  @Column({ type: 'int', nullable: false })
  duration: number;
  @Column({ type: 'uuid', nullable: true })
  addressId: string;
  @ManyToOne(() => Address, {
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  address: Address;
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;
  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'jsonb', nullable: true })
  careRecipientDateOfBirth: string[];
  
  @Column({ type: 'jsonb', nullable: true })
  careRecipientDetails: {
    whoNeedsCare?: string;
    gender?: string;
    ageGroup?: string;
  };
  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ type: 'uuid', nullable: false })
  userId: string;
  @Column({ type: 'jsonb', nullable: true })
  emergencyContacts: {
    primary: {
      name: string;
      phone: string;
      relationship: string;
    };
    secondary?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  @CreateDateColumn()
  canceledAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;
  @ManyToOne(() => User, (user) => user.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;
  @ManyToOne(() => CaregiverProfile, (caregiver) => caregiver.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'caregiverId' })
  caregiver: CaregiverProfile;
  @Column({ type: 'uuid', nullable: false })
  caregiverId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount: number;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @Column({ type: 'timestamp', nullable: true })
  clockInTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  proposedClockOutTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  clockOutTime: Date | null;
}
