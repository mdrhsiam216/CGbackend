import { Injectable, Inject } from '@nestjs/common';
import { BookingAdminRepository } from './repositories/booking-admin.repository';
import { TopCaregiversResponseDto } from './dtos/top-caregivers-response.dto';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';


// Use DTO classes in the dtos folder for API responses

@Injectable()
export class BookingAdminService {
  private readonly logTag = ServiceTags.ADMIN_SERVICE;

  constructor(
    private readonly bookingAdminRepository: BookingAdminRepository,
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
      const { items, total } = await this.bookingAdminRepository.getTopPerformingCaregivers({
        page,
        limit,
        minRating,
        minReviews,
        sortBy,
        order,
      });

      const totalPages = Math.ceil(total / limit);

      const result = items.map((c) => c as any);

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
}