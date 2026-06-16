import { QueryRunner } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';
import { User } from '../../user/entities/user.entity';

export interface IBookingRepository {
  createBookingWithQueryRunner(
    queryRunner: QueryRunner,
    bookingData: Partial<Booking>,
  ): Promise<Booking>;

  findBookingById(bookingId: string): Promise<Booking | null>;
  findAllBookings(
    userId?: string,
    caregiverId?: string,
    status?: string[],
    page?: number,
    limit?: number,
  ): Promise<{ bookings: Booking[]; total: number }>;
  findAll(): Promise<Booking[]>;
  findByCaregiverId(caregiverId: string): Promise<Booking[]>;
  findBookingsByUserId(userId: string): Promise<Booking[]>;
  findActiveBookingsByCaregiverId(caregiverId: string): Promise<Booking[]>;

  validateCaregiverExists(
    queryRunner: QueryRunner,
    caregiverId: string,
  ): Promise<CaregiverProfile>;
  validateUserExists(queryRunner: QueryRunner, userId: string): Promise<User>;

  updateBookingStatus(
    queryRunner: QueryRunner,
    bookingId: string,
    userId: string,
  ): Promise<Booking | null>;

  softDeleteBooking(
    queryRunner: QueryRunner,
    bookingId: string,
  ): Promise<Booking | null>;
}

export interface BookingSession {
  id: string;
  userId: string;
  caregiverId: string;
  status: string;
  date: Date;
  startTime: string;
  endTime: string;
  totalCost: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
  user?: User;
  caregiver?: CaregiverProfile;
}
