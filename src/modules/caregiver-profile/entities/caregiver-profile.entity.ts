import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AvailabilitySlot } from 'src/modules/availability-slot/entities/availability-slot.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../review/entities/review.entity';
import { Certificate } from '../../certificate/entities/certificate.entity';
import { Address } from '../../address/entities/address.entity';
@Entity('caregiver_profiles')
export class CaregiverProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.caregiverProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  nid: string;

  @Column({ type: 'decimal', default: 0 })
  baseHourlyRate: number;

  @Column({ type: 'text', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  specializations: string[];

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  languageSpoken: string[];

  @Column({ nullable: true })
  serviceArea: string;

  @Column({ nullable: true })
  radius: number;

  @Column({ type: 'uuid', nullable: true })
  addressId: string;

  @OneToOne(() => Address, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column({ default: false })
  verified: boolean;
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => Booking, (booking) => booking.caregiver)
  bookings: Booking[];
  @OneToMany(
    () => AvailabilitySlot,
    (availabilitySlot) => availabilitySlot.caregiver,
    { cascade: true },
  )
  availabilitySlots: AvailabilitySlot[];

  @OneToMany(() => Review, (review) => review.caregiverProfile)
  reviews: Review[];

  @OneToMany(() => Certificate, (certificate) => certificate.caregiverProfile, {
    cascade: true,
  })
  certificates: Certificate[];
}
