import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
  ) {}

  async create(reviewData: Partial<Review>): Promise<Review> {
    const review = this.repository.create(reviewData);
    return this.repository.save(review);
  }

  async findByCaregiverProfileId(
    caregiverProfileId: string,
  ): Promise<Review[]> {
    return this.repository.find({
      where: { caregiverProfileId },
      relations: ['client', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClientIdAndCaregiverProfileId(
    clientId: string,
    caregiverProfileId: string,
  ): Promise<Review | null> {
    return this.repository.findOne({
      where: { clientId, caregiverProfileId },
    });
  }

  async calculateReviewStats(
    caregiverProfileId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await this.repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.caregiverProfileId = :caregiverProfileId', {
        caregiverProfileId,
      })
      .getRawOne();

    const averageRating = result?.averageRating
      ? parseFloat(result.averageRating)
      : 0;
    const totalReviews = result?.totalReviews
      ? parseInt(result.totalReviews, 10)
      : 0;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews,
    };
  }

  async findById(id: string): Promise<Review | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['client', 'caregiverProfile', 'booking'],
    });
  }
}
