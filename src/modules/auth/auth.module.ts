import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth } from './entities/auth.entity';
import { SmsVerification } from './entities/sms-verification.entity';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';
import { ClientProfile } from '../client-profile/entities/client-profile.entity';
import { CaregiverProfileRepository } from '../caregiver-profile/repositories/caregiver-profile.repository';
import { Review } from '../review/entities/review.entity';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';

import { JwtTokenService } from './services/jwt-token.service';
import { OtpService } from './services/otp.service';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';
import { SmsVerificationRepository } from './repositories/sms-verification.repository';
import { SmsService } from '../../shared/services/sms.service';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Auth,
      SmsVerification,
      User,
      UserRole,
      Role,
      CaregiverProfile,
      ClientProfile,
      Review,
      AvailabilitySlot,
    ]),
    PassportModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET', 'default-jwt-secret'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    OtpService,
    SmsService,
    AuthSessionsRepository,
    SmsVerificationRepository,
    CaregiverProfileRepository,
    CustomLogger,
    {
      provide: 'IAuthSessionsRepository',
      useClass: AuthSessionsRepository,
    },
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
