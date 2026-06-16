import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';
import { User } from '../../user/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('reviews')
@Unique(['bookingId'])
@Index(['caregiverProfileId'])
@Index(['clientId'])
@Index(['bookingId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Completed booking (service) this review is for. One review per service. Null only for legacy reviews created before service-based flow. */
  @Column({ type: 'uuid', name: 'booking_id', nullable: true })
  bookingId: string | null;

  @Column({ type: 'uuid', name: 'caregiver_profile_id' })
  caregiverProfileId: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(
    () => CaregiverProfile,
    (caregiverProfile) => caregiverProfile.reviews,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'caregiver_profile_id' })
  caregiverProfile: CaregiverProfile;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
