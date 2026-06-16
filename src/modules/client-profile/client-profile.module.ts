import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/repository/user.repository';
import { UserModule } from '../user/user.module';
import { AddressModule } from '../address/address.module';
import { ClientProfileController } from './client-profile.controller';
import { ClientProfileService } from './client-profile.service';
import { ClientProfile } from './entities/client-profile.entity';
import { ClientProfileRepository } from './repositories/client-profile.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { ILogger } from '../../shared/interfaces/logger.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientProfile, User]),
    UserModule,
    AddressModule,
  ],
  controllers: [ClientProfileController],
  providers: [
    ClientProfileService,
    ClientProfileRepository,
    UserRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [ClientProfileService],
})
export class ClientProfileModule {}
