import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';

@Injectable()
export class BookingAdminRepository {
  constructor(
    @InjectRepository(CaregiverProfile)
    private readonly caregiverProfileRepository: Repository<CaregiverProfile>,
  ) {}

  async getTopPerformingCaregivers(options: {
    page?: number;
    limit?: number;
    minRating?: number;
    minReviews?: number;
    sortBy?: 'rating' | 'reviews' | 'bookings';
    order?: 'ASC' | 'DESC';
  }): Promise<{
    items: Array<Record<string, any>>;
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      minRating = 4.0,
      minReviews = 1,
      sortBy = 'rating',
      order = 'DESC',
    } = options;

    const qb = this.caregiverProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoin('profile.reviews', 'review')
      .leftJoin('profile.bookings', 'booking', "booking.status = 'completed'")
      .select([
        'profile.id',
        'profile.profilePictureUrl',
        'profile.baseHourlyRate',
        'profile.specializations',
        'profile.yearsOfExperience',
        'profile.verified',
        'profile.createdAt',
        'user.id',
        'user.firstName',
        'user.lastName',
      ])
      .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
      .addSelect('COUNT(DISTINCT review.id)', 'totalReviews')
      .addSelect('COUNT(DISTINCT booking.id)', 'totalBookings')
      .groupBy('profile.id')
      .addGroupBy('user.id');

    // Apply filters via HAVING to use aggregates
    qb.having('COALESCE(AVG(review.rating), 0) >= :minRating', {
      minRating,
    }).andHaving('COUNT(DISTINCT review.id) >= :minReviews', { minReviews });

    // Sorting
    const sortField = sortBy === 'rating' ? 'averageRating' : sortBy === 'reviews' ? 'totalReviews' : 'totalBookings';
    qb.orderBy(sortField, order as 'ASC' | 'DESC');

    // Get total (without pagination)
    const allRows = await qb.getRawMany();
    const total = allRows.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    qb.offset(skip).limit(limit);

    const pageRows = await qb.getRawMany();

    // Map raw results into friendly objects
    const items = pageRows.map((r) => ({
      id: r.profile_id,
      fullName: `${r.user_firstName || ''} ${r.user_lastName || ''}`.trim() || 'Unknown Caregiver',
      profilePictureUrl: r.profile_profilePictureUrl,
      averageRating: parseFloat(r.averageRating) || 0,
      totalReviews: parseInt(r.totalReviews, 10) || 0,
      totalBookings: parseInt(r.totalBookings, 10) || 0,
      baseHourlyRate: parseFloat(r.profile_baseHourlyRate) || 0,
      specializations: r.profile_specializations || [],
      yearsOfExperience: r.profile_yearsOfExperience === null ? undefined : parseInt(r.profile_yearsOfExperience, 10),
      verified: r.profile_verified,
      createdAt: r.profile_createdAt,
    }));

    return { items, total };
  }
}
