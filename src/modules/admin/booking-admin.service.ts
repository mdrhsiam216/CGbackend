import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';
import { ReviewRepository } from '../review/repositories/review.repository';
import { Booking } from '../bookings/entities/booking.entity';
import { TopCaregiversResponseDto } from './dtos/top-caregivers-response.dto';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';


// Use DTO classes in the dtos folder for API responses

@Injectable()
export class BookingAdminService {
  private readonly logTag = ServiceTags.ADMIN_SERVICE;

  constructor(
    @InjectRepository(CaregiverProfile)
    private readonly caregiverProfileRepository: Repository<CaregiverProfile>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly reviewRepository: ReviewRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async getTopPerformingCaregivers(
    page: number = 1,
    limit: number = 10,
    minRating: number = 4.0,
    minReviews: number = 1,
    sortBy: 'rating' | 'reviews' | 'bookings' = 'rating',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<TopCaregiversResponseDto> {
    try {
      this.logger.log(this.logTag, `Fetching top performing caregivers`);

      // Step 1: Get all caregiver profiles
      const caregiverProfiles = await this.caregiverProfileRepository.find({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      if (!caregiverProfiles.length) {
        this.logger.log(this.logTag, 'No caregiver profiles found');
        return {
          caregivers: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }

      // Step 2: For each caregiver, get review stats and booking count
      const caregiversWithStats = await Promise.all(
        caregiverProfiles.map(async (profile) => {
          // Get review statistics
          const reviewStats = await this.reviewRepository.calculateReviewStats(
            profile.id,
          );

          // Get total bookings count
          const bookingCount = await this.bookingRepository.count({
            where: { caregiverId: profile.id },
          });

          // Get user's full name
          const fullName = profile.user
            ? `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim()
            : 'Unknown Caregiver';

          return {
            profile,
            averageRating: reviewStats.averageRating,
            totalReviews: reviewStats.totalReviews,
            totalBookings: bookingCount,
            fullName,
          };
        }),
      );

      // Step 3: Filter by minimum rating and reviews
      const filteredCaregivers = caregiversWithStats.filter(
        (c) => c.averageRating >= minRating && c.totalReviews >= minReviews,
      );

      // Step 4: Sort caregivers
      const sortedCaregivers = this.sortCaregivers(
        filteredCaregivers,
        sortBy,
        order,
      );

      // Step 5: Paginate results
      const total = sortedCaregivers.length;
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
      const paginatedCaregivers = sortedCaregivers.slice(skip, skip + limit);

      // Step 6: Map to DTO-like plain objects
      const result = paginatedCaregivers.map((c) => ({
        id: c.profile.id,
        fullName: c.fullName,
        profilePictureUrl: c.profile.profilePictureUrl,
        averageRating: c.averageRating,
        totalReviews: c.totalReviews,
        totalBookings: c.totalBookings,
        baseHourlyRate: c.profile.baseHourlyRate,
        specializations: c.profile.specializations || [],
        yearsOfExperience:
          c.profile.yearsOfExperience === null
            ? undefined
            : c.profile.yearsOfExperience,
        verified: c.profile.verified,
        createdAt: c.profile.createdAt,
      }));

      this.logger.log(
        this.logTag,
        `Retrieved ${result.length} top caregivers (page ${page}/${totalPages})`,
      );

      return {
        caregivers: result,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        `Failed to fetch top performing caregivers: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw error;
    }
  }

  private sortCaregivers(
    caregivers: Array<{
      profile: CaregiverProfile;
      averageRating: number;
      totalReviews: number;
      totalBookings: number;
      fullName: string;
    }>,
    sortBy: 'rating' | 'reviews' | 'bookings',
    order: 'ASC' | 'DESC',
  ): typeof caregivers {
    const sortMap: Record<typeof sortBy, keyof typeof caregivers[number]> = {
      rating: 'averageRating',
      reviews: 'totalReviews',
      bookings: 'totalBookings',
    };

    const field = sortMap[sortBy];
    const multiplier = order === 'ASC' ? 1 : -1;

    return [...caregivers].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return -1 * multiplier;
      if (aVal > bVal) return 1 * multiplier;
      
      // Secondary sort by rating if same primary sort value
      if (sortBy !== 'rating') {
        if (a.averageRating < b.averageRating) return -1 * multiplier;
        if (a.averageRating > b.averageRating) return 1 * multiplier;
      }
      
      // Tertiary sort by total reviews
      if (a.totalReviews < b.totalReviews) return -1 * multiplier;
      if (a.totalReviews > b.totalReviews) return 1 * multiplier;
      
      return 0;
    });
  }
}