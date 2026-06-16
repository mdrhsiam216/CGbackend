import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseService } from './services/firebase.service';
import { PushNotificationService } from './services/push-notification.service';
import { UserDevice } from '../../modules/notification/entities/user-device.entity';
import { Notification } from '../../modules/notification/entities/notification.entity';
import { CustomLogger } from '../services/custom-logger.service';

/**
 * PushNotificationModule - Global module for push notification services
 *
 * This module provides push notification services that can be used across
 * the entire application without explicit imports.
 *
 * Available services:
 * - PushNotificationService: Send push notifications from any service
 * - FirebaseService: Direct Firebase Admin SDK access
 *
 * @example
 * // In any service, just inject PushNotificationService:
 * constructor(
 *   private readonly pushNotificationService: PushNotificationService,
 * ) {}
 *
 * // Send notification:
 * await this.pushNotificationService.notifyNewMessage(
 *   receiverId,
 *   senderName,
 *   messagePreview,
 *   conversationId,
 *   senderId,
 * );
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserDevice, Notification])],
  providers: [
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
    FirebaseService,
    PushNotificationService,
  ],
  exports: [FirebaseService, PushNotificationService],
})
export class PushNotificationModule {}
