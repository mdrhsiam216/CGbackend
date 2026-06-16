import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum TimeSlot {
  MORNINGS = 'mornings', // 6 AM - 12 PM
  AFTERNOONS = 'afternoons', // 12 PM - 6 PM
  EVENINGS = 'evenings', // 6 PM - 10 PM
  OVERNIGHT = 'overnight', // 10 PM - 6 AM
}

@Entity('availability_slots')
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CaregiverProfile,
    (caregiver) => caregiver.availabilitySlots,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'caregiverId' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid' })
  caregiverId: string;

  // Days of week (stored as array of numbers 0-6)
  @Column({ type: 'jsonb' })
  daysOfWeek: number[];

  // Time slots (mornings, afternoons, evenings, overnight)
  @Column({ type: 'jsonb', nullable: true })
  timeSlots: string[] | null;

  // Specific times (required - HH:MM format)
  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: false })
  scheduleMayVary: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedMinRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedMaxRate: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
