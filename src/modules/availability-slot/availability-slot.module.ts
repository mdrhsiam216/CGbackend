import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingRepository } from '../bookings/booking-caregiver.repository';
import { Booking } from '../bookings/entities/booking.entity';
import { CaregiverProfileModule } from '../caregiver-profile/caregiver-profile.module';
import { AvailabilitySlotController } from './availability-slot.controller';
import { AvailabilitySlotService } from './availability-slot.service';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { AvailabilitySlotRepository } from './repository/availability-slot.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilitySlot, Booking]),
    CaregiverProfileModule,
  ],
  controllers: [AvailabilitySlotController],
  providers: [
    AvailabilitySlotService,
    AvailabilitySlotRepository,
    BookingRepository,
  ],
  exports: [AvailabilitySlotService],
})
export class AvailabilitySlotModule {}
