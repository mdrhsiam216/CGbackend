import { Module, Global } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { CustomLogger } from '../services/custom-logger.service';

@Global()
@Module({
  providers: [
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
    S3Service,
  ],
  exports: [S3Service],
})
export class AwsModule {}
