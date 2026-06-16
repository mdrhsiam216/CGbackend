import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { AddressRepository } from './repositories/address.repository';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { AuthModule } from '../auth/auth.module';
import { CustomLogger } from 'src/shared/services/custom-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), AuthModule],
  controllers: [AddressController],
  providers: [
    AddressService,
    AddressRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [AddressService, AddressRepository],
})
export class AddressModule {}
