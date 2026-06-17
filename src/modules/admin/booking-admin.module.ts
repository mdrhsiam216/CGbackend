import { Module } from '@nestjs/common';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingRepository } from '../bookings/booking-caregiver.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    
  ],

  controllers: [],
  providers: [
    
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [],
})
export class BookingAdminModule {}
