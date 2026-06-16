import { Module } from '@nestjs/common';
import { SSLCommerceService } from './SSL_commerce.service';
import { SSLCommerceController } from './SSL_commerce.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entity/SSL_payment.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Payment, Booking])],
  controllers: [SSLCommerceController],
  providers: [SSLCommerceService],
  exports: [SSLCommerceService],
})
export class SSLCommerceModule {}
