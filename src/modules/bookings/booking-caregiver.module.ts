import { Module } from '@nestjs/common';
import { BookingsController } from './booking-caregiver.controller';
import { BookingsService } from './booking-caregiver.service';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';
import { Booking } from './entities/booking.entity';
import { BookingRepository } from './booking-caregiver.repository';
import { SSLCommerceModule } from '../SSL_Commerce/SSL_commerce.module';
import { CaregiverProfileModule } from '../caregiver-profile/caregiver-profile.module';
import { AddressModule } from '../address/address.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    SSLCommerceModule,
    AvailabilitySlotModule,
    CaregiverProfileModule,
    AddressModule,
  ],

  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
