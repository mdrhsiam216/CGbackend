import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MapsGateway } from './maps.gateway';
import { MapsService } from './maps.service';
import { Booking } from '../bookings/entities/booking.entity';
import { RedisModule } from '../../shared/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { CaregiverProfileModule } from '../caregiver-profile/caregiver-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    RedisModule,
    AuthModule,
    CaregiverProfileModule,
    JwtModule,
    ConfigModule,
  ],
  providers: [MapsGateway, MapsService],
  exports: [MapsService],
})
export class MapsModule {}
