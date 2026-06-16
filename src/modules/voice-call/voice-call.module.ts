import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { VoiceCallService } from './voice-call.service';
import { VoiceCallController } from './controllers/voice-call.controller';
import { CustomLogger } from '../../shared/services/custom-logger.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [VoiceCallController],
  providers: [
    VoiceCallService,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [VoiceCallService],
})
export class VoiceCallModule {}
