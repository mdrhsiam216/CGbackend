import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UserDevice } from './entities/user-device.entity';
import { Notification } from './entities/notification.entity';
import { UserDeviceRepository } from './repositories/user-device.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { CustomLogger } from '../../shared/services/custom-logger.service';

/**
 * NotificationModule - Handles push notification REST API endpoints
 *
 * This module provides REST endpoints for:
 * - Device token registration
 * - Manual notification sending (admin/testing)
 * - Topic subscription management
 * - Notification history
 *
 * For sending notifications from other services (e.g., ChatService),
 * use the global PushNotificationService from PushNotificationModule instead.
 *
 * @example
 * // In ChatService:
 * import { PushNotificationService } from 'src/shared/push-notification';
 *
 * constructor(private readonly pushNotificationService: PushNotificationService) {}
 *
 * await this.pushNotificationService.notifyNewMessage(
 *   receiverId,
 *   senderName,
 *   messagePreview,
 *   conversationId,
 *   senderId
 * );
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserDevice, Notification])],
  controllers: [NotificationController],
  providers: [
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
    NotificationService,
    UserDeviceRepository,
    NotificationRepository,
  ],
  exports: [NotificationService, UserDeviceRepository, NotificationRepository],
})
export class NotificationModule {}
