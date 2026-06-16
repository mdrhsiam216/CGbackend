import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { Review } from '../../review/entities/review.entity';
import {
  QueryCaregiverProfileDto,
  SortOption,
} from '../dto/query-caregiver-profile.dto';
import { CaregiverProfile } from '../entities/caregiver-profile.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class CaregiverProfileRepository {
  constructor(
    @InjectRepository(CaregiverProfile)
    private readonly repository: Repository<CaregiverProfile>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(AvailabilitySlot)
    private readonly availabilitySlotRepository: Repository<AvailabilitySlot>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<CaregiverProfile | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'certificates', 'availabilitySlots', 'address'],
    });
  }

  async findByUserId(userId: string): Promise<CaregiverProfile | null> {
    return this.repository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'certificates', 'availabilitySlots', 'address'],
    });
  }

  async findAll(
    queryDto: QueryCaregiverProfileDto,
  ): Promise<{ data: CaregiverProfile[]; total: number }> {
    const {
      search,
      verified,
      specializations,
      basePrice,
      minRating,
      availableNow,
      sortBy,
      page = 1,
      limit = 10,
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('caregiverProfile')
      .leftJoinAndSelect('caregiverProfile.user', 'user')
      .leftJoinAndSelect('caregiverProfile.address', 'address');

    // Search filter
    if (search) {
      queryBuilder.where(
        "(user.firstName LIKE :search OR user.lastName LIKE :search OR CONCAT(user.firstName, ' ', user.lastName) LIKE :search OR caregiverProfile.bio LIKE :search OR address.address LIKE :search OR address.streetAddress LIKE :search OR address.city LIKE :search)",
        { search: `%${search}%` },
      );
    }

    // Verified filter
    if (verified !== undefined) {
      queryBuilder.andWhere('caregiverProfile.verified = :verified', {
        verified,
      });
    }

    // Specializations filter (array overlap - checks if any specialization matches)
    if (specializations && specializations.length > 0) {
      queryBuilder.andWhere(
        'caregiverProfile.specializations && ARRAY[:...specializations]::text[]',
        { specializations },
      );
    }

    // Base price filter
    if (basePrice !== undefined) {
      queryBuilder.andWhere('caregiverProfile.baseHourlyRate <= :basePrice', {
        basePrice,
      });
    }

    // Determine if we need GROUP BY (for rating filters or rating-based sorting)
    const needsGroupBy =
      minRating !== undefined ||
      sortBy === SortOption.HIGHLY_RATED ||
      sortBy === SortOption.RECOMMENDED;

    // Use consistent alias for reviews
    const reviewAlias = 'review';
    const bookingAlias = 'booking';

    // Minimum rating filter or rating-based sorting - need to join reviews
    if (needsGroupBy) {
      queryBuilder.leftJoin('caregiverProfile.reviews', reviewAlias);
    }

    // For recommendation algorithm, also need to join bookings to count completed jobs
    if (sortBy === SortOption.RECOMMENDED) {
      queryBuilder.leftJoin(
        'caregiverProfile.bookings',
        bookingAlias,
        `${bookingAlias}.status = :completedStatus`,
        { completedStatus: 'completed' },
      );
    }

    // Available now filter - check if caregiver has available slots for current day and time
    if (availableNow) {
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Use INNER JOIN to filter by availability - use @> operator to check if array contains the day
      const dayOfWeekJson = JSON.stringify([currentDayOfWeek]);
      queryBuilder.innerJoin(
        'caregiverProfile.availabilitySlots',
        'availableSlot',
        `availableSlot.isActive = true 
         AND availableSlot.daysOfWeek @> '${dayOfWeekJson}'::jsonb
         AND availableSlot.startTime <= :availableCurrentTime
         AND availableSlot.endTime >= :availableCurrentTime`,
        {
          availableCurrentTime: currentTime,
        },
      );
    }

    // Add GROUP BY if needed (for aggregations)
    if (needsGroupBy) {
      queryBuilder
        .groupBy('caregiverProfile.id')
        .addGroupBy('user.id')
        .addGroupBy('address.id');
      // If we have availability join, we might get duplicates - GROUP BY should handle it
      // but we need to ensure all selected columns are in GROUP BY or aggregated
    }

    // Add HAVING clause for minimum rating
    if (minRating !== undefined) {
      queryBuilder.having(
        `COALESCE(AVG(${reviewAlias}.rating), 0) >= :minRating`,
        {
          minRating,
        },
      );
    }

    // Add computed columns for sorting (avoids TypeORM alias parsing issues with raw SQL expressions)
    // These are only added when needed based on sortBy
    if (
      sortBy === SortOption.HIGHLY_RATED ||
      sortBy === SortOption.RECOMMENDED
    ) {
      queryBuilder.addSelect(
        `COALESCE(AVG(${reviewAlias}.rating), 0)`,
        'avg_rating',
      );
    }

    if (sortBy === SortOption.RECOMMENDED) {
      const recScoreExpr = `(0.35 * LEAST(COALESCE(COUNT(DISTINCT ${bookingAlias}.id), 0) / 50.0, 1.0)) + (0.45 * COALESCE(AVG(${reviewAlias}.rating), 0) / 5.0) + (0.20 * LEAST(COALESCE(caregiverProfile.yearsOfExperience, 0) / 20.0, 1.0))`;
      queryBuilder
        .addSelect(recScoreExpr, 'recommendation_score')
        .addSelect(
          `COALESCE(COUNT(DISTINCT ${bookingAlias}.id), 0)`,
          'completed_jobs_count',
        );
    }

    // Sorting
    if (sortBy) {
      switch (sortBy) {
        case SortOption.HIGHLY_RATED:
          queryBuilder.orderBy('avg_rating', 'DESC', 'NULLS LAST');
          break;
        case SortOption.PRICE_LOW_TO_HIGH:
          queryBuilder.orderBy('caregiverProfile.baseHourlyRate', 'ASC');
          break;
        case SortOption.PRICE_HIGH_TO_LOW:
          queryBuilder.orderBy('caregiverProfile.baseHourlyRate', 'DESC');
          break;
        case SortOption.MOST_EXPERIENCED:
          queryBuilder.orderBy(
            'caregiverProfile.yearsOfExperience',
            'DESC',
            'NULLS LAST',
          );
          break;
        case SortOption.RECOMMENDED:
        default:
          // Recommended algorithm: combines completed jobs count, average rating, and years of experience
          // Formula: (0.35 * normalized_completed_jobs) + (0.45 * normalized_rating) + (0.20 * normalized_experience)
          queryBuilder
            .orderBy('recommendation_score', 'DESC', 'NULLS LAST')
            .addOrderBy('avg_rating', 'DESC', 'NULLS LAST')
            .addOrderBy('completed_jobs_count', 'DESC', 'NULLS LAST')
            .addOrderBy(
              'caregiverProfile.yearsOfExperience',
              'DESC',
              'NULLS LAST',
            );
          break;
      }
    } else {
      // Default sorting by creation date (newest first)
      queryBuilder.orderBy('caregiverProfile.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findVerifiedProfiles(): Promise<CaregiverProfile[]> {
    return this.repository.find({
      where: { verified: true },
      relations: ['user', 'address'],
    });
  }

  async createProfile(
    profileData: Partial<CaregiverProfile>,
  ): Promise<CaregiverProfile> {
    const profile = this.repository.create(profileData);
    return this.repository.save(profile);
  }

  async updateProfile(profile: CaregiverProfile): Promise<CaregiverProfile> {
    return this.repository.save(profile);
  }

  async removeProfile(profile: CaregiverProfile): Promise<void> {
    await this.repository.remove(profile);
  }

  // Transaction methods
  async findByIdWithQueryRunner(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<CaregiverProfile | null> {
    return queryRunner.manager.findOne(CaregiverProfile, {
      where: { id },
      relations: ['user', 'address'],
    });
  }

  async findByUserIdWithQueryRunner(
    queryRunner: QueryRunner,
    userId: string,
  ): Promise<CaregiverProfile | null> {
    return queryRunner.manager.findOne(CaregiverProfile, {
      where: { user: { id: userId } },
      relations: ['user', 'address'],
    });
  }

  async createWithQueryRunner(
    queryRunner: QueryRunner,
    profileData: Partial<CaregiverProfile>,
  ): Promise<CaregiverProfile> {
    const profile = queryRunner.manager.create(CaregiverProfile, profileData);
    return queryRunner.manager.save(profile);
  }

  async updateWithQueryRunner(
    queryRunner: QueryRunner,
    profile: CaregiverProfile,
  ): Promise<CaregiverProfile> {
    return queryRunner.manager.save(profile);
  }

  async removeWithQueryRunner(
    queryRunner: QueryRunner,
    profile: CaregiverProfile,
  ): Promise<void> {
    await queryRunner.manager.remove(profile);
  }

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  async getReviewStats(
    caregiverProfileId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    // Get stats for a single profile
    const statsMap = await this.getBatchReviewStats([caregiverProfileId]);
    return (
      statsMap.get(caregiverProfileId) || {
        averageRating: 0,
        totalReviews: 0,
      }
    );
  }

  createAvailabilitySlotEntities(
    slots: Array<Partial<AvailabilitySlot>>,
  ): AvailabilitySlot[] {
    return this.availabilitySlotRepository.create(slots);
  }

  async deleteAvailabilitySlotsByDay(
    caregiverId: string,
    dayOfWeek: number,
  ): Promise<void> {
    const slots = await this.availabilitySlotRepository.find({
      where: { caregiverId },
    });

    const toRemove: AvailabilitySlot[] = [];
    const toUpdate: AvailabilitySlot[] = [];

    for (const slot of slots) {
      if (!slot.daysOfWeek?.includes(dayOfWeek)) continue;

      if (slot.daysOfWeek.length === 1) {
        toRemove.push(slot);
      } else {
        slot.daysOfWeek = slot.daysOfWeek.filter((d) => d !== dayOfWeek);
        toUpdate.push(slot);
      }
    }

    if (toUpdate.length) await this.availabilitySlotRepository.save(toUpdate);
    if (toRemove.length) await this.availabilitySlotRepository.remove(toRemove);
  }

  async getBatchReviewStats(
    caregiverProfileIds: string[],
  ): Promise<Map<string, { averageRating: number; totalReviews: number }>> {
    if (caregiverProfileIds.length === 0) {
      return new Map();
    }

    const results = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.caregiverProfileId', 'caregiverProfileId')
      .addSelect('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.caregiverProfileId IN (:...caregiverProfileIds)', {
        caregiverProfileIds,
      })
      .groupBy('review.caregiverProfileId')
      .getRawMany();

    const statsMap = new Map<
      string,
      { averageRating: number; totalReviews: number }
    >();

    // Initialize all profiles with zero stats
    caregiverProfileIds.forEach((id) => {
      statsMap.set(id, { averageRating: 0, totalReviews: 0 });
    });

    // Update with actual stats
    results.forEach((result) => {
      const averageRating = result.averageRating
        ? Math.round(parseFloat(result.averageRating) * 10) / 10
        : 0;
      const totalReviews = result.totalReviews
        ? parseInt(result.totalReviews, 10)
        : 0;

      statsMap.set(result.caregiverProfileId, {
        averageRating,
        totalReviews,
      });
    });

    return statsMap;
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
