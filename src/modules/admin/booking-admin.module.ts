import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Review } from '../review/entities/review.entity';
import { BookingAdminController } from './booking-admin.controller';
import { BookingAdminService } from './booking-admin.service';
import { BookingAdminRepository } from './booking-admin.repository';
import { ReviewRepository } from '../review/repositories/review.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaregiverProfile, Booking, Review]),
    AuthModule, // For JwtAuthGuard and RolesGuard
  ],
  controllers: [BookingAdminController],
  providers: [
    BookingAdminService,
    BookingAdminRepository,
    ReviewRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [BookingAdminService],
})
export class BookingAdminModule {}