import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { PushNotificationModule } from './shared/push-notification';
import { AwsModule } from './shared/aws';
import { RedisModule } from './shared/redis';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { ClientProfileModule } from './modules/client-profile/client-profile.module';
import { CaregiverProfileModule } from './modules/caregiver-profile/caregiver-profile.module';
import { RoleModule } from './modules/role/role.module';
import { AvailabilitySlotModule } from './modules/availability-slot/availability-slot.module';
import { AddressModule } from './modules/address/address.module';
import { VoiceCallModule } from './modules/voice-call/voice-call.module';
import { BookingsModule } from './modules/bookings/booking-caregiver.module';
import { ChatModule } from './modules/chat/chat.module';
import { SSLCommerceModule } from './modules/SSL_Commerce/SSL_commerce.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './modules/notification/notification.module';
import { ReviewModule } from './modules/review/review.module';
import { MapsModule } from './modules/maps/maps.module';
import { CertificateModule } from './modules/certificate/certificate.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    DatabaseModule,
    PushNotificationModule, // Global push notification services
    AwsModule, // Global AWS services (S3)
    RedisModule, // Global Redis cache services
    HealthModule,
    AuthModule,
    UserModule,
    RoleModule,
    UserRoleModule,
    ClientProfileModule,
    CaregiverProfileModule,
    AvailabilitySlotModule,
    AddressModule,
    VoiceCallModule,
    ChatModule,
    BookingsModule,
    SSLCommerceModule,
    NotificationModule,
    ReviewModule,
    MapsModule, // Real-time location tracking with WebSocket
    CertificateModule, // Certificate management module
  ],
})
export class AppModule {}
