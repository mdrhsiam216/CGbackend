import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './repositories/review.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking])],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule { }
