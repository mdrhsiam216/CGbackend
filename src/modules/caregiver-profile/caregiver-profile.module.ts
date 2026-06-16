import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { CaregiverProfileUserController } from './controllers/caregiver-profile.user.controller';
import { CaregiverProfileAdminController } from './controllers/caregiver-profile.admin.controller';
import { CaregiverProfileService } from './caregiver-profile.service';
import { CaregiverProfile } from './entities/caregiver-profile.entity';
import { CaregiverProfileRepository } from './repositories/caregiver-profile.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { Review } from '../review/entities/review.entity';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { AddressModule } from '../address/address.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CaregiverProfile,
      User,
      Review,
      AvailabilitySlot,
      Booking,
    ]),
    UserModule,
    AuthModule,
    AddressModule,
  ],
  controllers: [
    CaregiverProfileUserController,
    CaregiverProfileAdminController,
  ],
  providers: [
    CaregiverProfileService,
    CaregiverProfileRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [
    CaregiverProfileService,
    CaregiverProfileRepository,
  ],
})
export class CaregiverProfileModule {}
