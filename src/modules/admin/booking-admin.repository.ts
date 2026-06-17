import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, In } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';

@Injectable()
export class BookingAdminRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(CaregiverProfile)
    private readonly caregiverProfileRepository: Repository<CaregiverProfile>,
    private readonly dataSource: DataSource,
  ) {}

  // This repository can be extended for additional admin-specific queries
  // For now, the service uses direct repository injections
  
  async getCaregiverBookingStats(
    caregiverId: string,
  ): Promise<{
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
  }> {
    const [total, completed, pending, cancelled] = await Promise.all([
      this.bookingRepository.count({ where: { caregiverId } }),
      this.bookingRepository.count({
        where: { caregiverId, status: 'completed' },
      }),
      this.bookingRepository.count({
        where: { caregiverId, status: 'pending' },
      }),
      this.bookingRepository.count({
        where: { caregiverId, status: 'cancelled' },
      }),
    ]);

    return {
      totalBookings: total,
      completedBookings: completed,
      pendingBookings: pending,
      cancelledBookings: cancelled,
    };
  }

  async getTopCaregiversByBookings(
    limit: number = 10,
  ): Promise<CaregiverProfile[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.caregiverId', 'caregiverId')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .where('booking.status = :status', { status: 'completed' })
      .groupBy('booking.caregiverId')
      .orderBy('bookingCount', 'DESC')
      .limit(limit);

    const results = await queryBuilder.getRawMany();
    
    if (!results.length) {
      return [];
    }

    const caregiverIds = results.map((r) => r.caregiverId);
    
    return this.caregiverProfileRepository.find({
      where: { id: In(caregiverIds) },
      order: { createdAt: 'DESC' },
    });
  }
}