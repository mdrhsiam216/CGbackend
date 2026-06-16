import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { CertificateController } from './controllers/certificate.controller';
import { CertificateService } from './services/certificate.service';
import { CertificateRepository } from './repositories/certificate.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { CaregiverProfileModule } from '../caregiver-profile/caregiver-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    CaregiverProfileModule, // Import to access CaregiverProfileRepository
  ],
  controllers: [CertificateController],
  providers: [
    CertificateService,
    CertificateRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [CertificateService, CertificateRepository],
})
export class CertificateModule {}
