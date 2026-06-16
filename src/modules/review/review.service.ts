import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ReviewRepository } from './repositories/review.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { ResponseReviewDto } from './dto/response-review.dto';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { RatingReviewErrorMessages } from '../../shared/enums';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';

const BOOKING_STATUS_COMPLETED = 'completed';

@Injectable()
export class ReviewService {
  private readonly logTag = ServiceTags.REVIEW_SERVICE;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly reviewRepository: ReviewRepository,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async create(
    clientId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ResponseReviewDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(
        this.logTag,
        `Creating review for booking: ${createReviewDto.bookingId} by client: ${clientId}`,
      );

      const booking = await this.bookingRepository.findOne({
        where: { id: createReviewDto.bookingId },
        select: ['id', 'userId', 'caregiverId', 'status', 'clockOutTime'],
      });

      if (!booking) {
        throw new NotFoundException(
          RatingReviewErrorMessages.BOOKING_NOT_FOUND,
        );
      }

      if (!booking.caregiverId) {
        throw new BadRequestException(
          RatingReviewErrorMessages.BOOKING_NOT_ELIGIBLE_FOR_REVIEW,
        );
      }

      if (booking.userId !== clientId) {
        throw new BadRequestException(
          RatingReviewErrorMessages.ONLY_BOOKING_CLIENT_CAN_REVIEW,
        );
      }

      if (
        booking.status !== BOOKING_STATUS_COMPLETED ||
        !booking.clockOutTime
      ) {
        throw new BadRequestException(
          RatingReviewErrorMessages.BOOKING_NOT_ELIGIBLE_FOR_REVIEW,
        );
      }

      const existingReview = await queryRunner.manager.findOne(Review, {
        where: { bookingId: createReviewDto.bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (existingReview) {
        throw new ConflictException(
          RatingReviewErrorMessages.REVIEW_ALREADY_SUBMITTED,
        );
      }

      const reviewData: Partial<Review> = {
        bookingId: createReviewDto.bookingId,
        caregiverProfileId: booking.caregiverId,
        clientId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment || null,
      };

      const review = queryRunner.manager.create(Review, reviewData);
      const savedReview = await queryRunner.manager.save(review);

      await queryRunner.commitTransaction();

      const fullReview = await this.reviewRepository.findById(savedReview.id);
      if (!fullReview) {
        throw new NotFoundException(
          RatingReviewErrorMessages.RATING_REVIEW_NOT_FOUND,
        );
      }

      this.logger.log(
        this.logTag,
        `Review created successfully: ${savedReview.id}`,
      );

      const serviceData =
        fullReview.booking && fullReview.bookingId
          ? {
              id: fullReview.booking.id,
              serviceType: fullReview.booking.serviceType,
              date: fullReview.booking.date,
              startTime: fullReview.booking.startTime,
              duration: fullReview.booking.duration,
            }
          : undefined;

      return plainToInstance(ResponseReviewDto, {
        id: fullReview.id,
        bookingId: fullReview.bookingId,
        caregiverProfileId: fullReview.caregiverProfileId,
        service: serviceData,
        reviewer: {
          id: fullReview.client.id,
          fullName:
            fullReview.client.firstName && fullReview.client.lastName
              ? `${fullReview.client.firstName} ${fullReview.client.lastName}`
              : fullReview.client.firstName ||
                fullReview.client.lastName ||
                'Anonymous',
          email: fullReview.client.email,
        },
        rating: fullReview.rating,
        comment: fullReview.comment,
        createdAt: fullReview.createdAt,
        updatedAt: fullReview.updatedAt,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        `Failed to create review: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw new BadRequestException(
        RatingReviewErrorMessages.RATING_REVIEW_CREATION_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findByCaregiverProfileId(
    caregiverProfileId: string,
  ): Promise<ResponseReviewDto[]> {
    try {
      const reviews =
        await this.reviewRepository.findByCaregiverProfileId(
          caregiverProfileId,
        );

      return plainToInstance(
        ResponseReviewDto,
        reviews.map((review) => {
          // Handle legacy reviews (without booking) gracefully
          const serviceData =
            review.booking && review.bookingId
              ? {
                  id: review.booking.id,
                  serviceType: review.booking.serviceType,
                  date: review.booking.date,
                  startTime: review.booking.startTime,
                  duration: review.booking.duration,
                }
              : undefined;

          return {
            id: review.id,
            bookingId: review.bookingId,
            caregiverProfileId: review.caregiverProfileId,
            service: serviceData,
            reviewer: {
              id: review.client.id,
              fullName:
                review.client.firstName && review.client.lastName
                  ? `${review.client.firstName} ${review.client.lastName}`
                  : review.client.firstName ||
                    review.client.lastName ||
                    'Anonymous',
              email: review.client.email,
            },
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          };
        }),
      );
    } catch (error) {
      this.logger.error(
        this.logTag,
        `Failed to fetch reviews for caregiver: ${caregiverProfileId}`,
        error,
      );
      throw new NotFoundException(
        RatingReviewErrorMessages.RATING_REVIEW_NOT_FOUND,
      );
    }
  }

  async calculateAverageRating(caregiverProfileId: string): Promise<number> {
    try {
      const stats =
        await this.reviewRepository.calculateReviewStats(caregiverProfileId);
      return stats.averageRating;
    } catch (error) {
      this.logger.error(
        this.logTag,
        `Failed to calculate average rating for caregiver: ${caregiverProfileId}`,
        error,
      );
      return 0;
    }
  }

  async getReviewStats(
    caregiverProfileId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    try {
      return await this.reviewRepository.calculateReviewStats(
        caregiverProfileId,
      );
    } catch (error) {
      this.logger.error(
        this.logTag,
        `Failed to get review stats for caregiver: ${caregiverProfileId}`,
        error,
      );
      return { averageRating: 0, totalReviews: 0 };
    }
  }
}
