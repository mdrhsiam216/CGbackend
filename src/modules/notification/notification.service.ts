import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { ILogger } from '../../shared/interfaces/logger.interface';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import { FirebaseService } from '../../shared/push-notification';
import { UserDeviceRepository } from './repositories/user-device.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationStatus } from './entities/notification.entity';
import { DeviceType } from './entities/user-device.entity';
import {
  RegisterDeviceDto,
  SendNotificationToUserDto,
  SendNotificationToMultipleDto,
  SendNotificationToTopicDto,
  TopicSubscriptionDto,
  ResponseDeviceDto,
  ResponseNotificationDto,
  SendNotificationResponseDto,
} from './dto';
import { NotificationErrorMessages } from '../../shared/enums';

@Injectable()
export class NotificationService {
  private readonly logTag = ServiceTags.NOTIFICATION_SERVICE;

  constructor(
    private readonly userDeviceRepository: UserDeviceRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly firebaseService: FirebaseService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  /**
   * Register a device token for push notifications
   */
  async registerDevice(
    userId: string,
    registerDeviceDto: RegisterDeviceDto,
  ): Promise<ResponseDeviceDto> {
    try {
      this.logger.log(this.logTag, 'Registering device', {
        userId,
        deviceType: registerDeviceDto.deviceType,
      });

      const device = await this.userDeviceRepository.upsertDevice({
        userId,
        deviceToken: registerDeviceDto.deviceToken,
        deviceType: registerDeviceDto.deviceType as DeviceType,
      });

      this.logger.log(this.logTag, 'Device registered successfully', {
        deviceId: device.id,
        userId,
      });

      return plainToInstance(ResponseDeviceDto, device, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(this.logTag, 'Failed to register device', error);
      throw new InternalServerErrorException(
        NotificationErrorMessages.DEVICE_REGISTRATION_FAILED,
      );
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(userId: string, deviceToken: string): Promise<void> {
    try {
      this.logger.log(this.logTag, 'Unregistering device', { userId });

      const device = await this.userDeviceRepository.findByUserIdAndToken(
        userId,
        deviceToken,
      );

      if (!device) {
        throw new NotFoundException(NotificationErrorMessages.DEVICE_NOT_FOUND);
      }

      await this.userDeviceRepository.deactivateDevice(deviceToken);

      this.logger.log(this.logTag, 'Device unregistered successfully', {
        userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(this.logTag, 'Failed to unregister device', error);
      throw new InternalServerErrorException(
        NotificationErrorMessages.DEVICE_UNREGISTRATION_FAILED,
      );
    }
  }

  /**
   * Get all registered devices for a user
   */
  async getUserDevices(userId: string): Promise<ResponseDeviceDto[]> {
    try {
      const devices = await this.userDeviceRepository.findByUserId(userId);
      return plainToInstance(ResponseDeviceDto, devices, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(this.logTag, 'Failed to fetch user devices', error);
      throw new InternalServerErrorException(
        NotificationErrorMessages.DEVICE_FETCH_FAILED,
      );
    }
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(
    dto: SendNotificationToUserDto,
  ): Promise<SendNotificationResponseDto> {
    try {
      this.logger.log(this.logTag, 'Sending notification to user', {
        userId: dto.userId,
        title: dto.title,
      });

      const deviceTokens =
        await this.userDeviceRepository.getActiveDeviceTokensByUserId(
          dto.userId,
        );

      if (deviceTokens.length === 0) {
        this.logger.warn(this.logTag, 'No active devices found for user', {
          userId: dto.userId,
        });

        // Still log the notification attempt
        const notification = await this.notificationRepository.create({
          userId: dto.userId,
          title: dto.title,
          body: dto.body,
          payload: dto.data || null,
          status: NotificationStatus.FAILED,
          errorMessage: 'No active devices found',
          sentAt: new Date(),
        });

        return {
          success: false,
          notificationId: notification.id,
          successCount: 0,
          failureCount: 0,
          message: 'No active devices found for user',
        };
      }

      const fcmResponse = await this.firebaseService.sendToDevices(
        deviceTokens,
        {
          title: dto.title,
          body: dto.body,
          data: dto.data,
        },
      );

      const status =
        fcmResponse.failureCount === 0
          ? NotificationStatus.SUCCESS
          : fcmResponse.successCount === 0
            ? NotificationStatus.FAILED
            : NotificationStatus.PARTIAL;

      const notification = await this.notificationRepository.create({
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        payload: dto.data || null,
        status,
        fcmResponse: fcmResponse as unknown as Record<string, any>,
        sentAt: new Date(),
      });

      this.logger.log(this.logTag, 'Notification sent', {
        notificationId: notification.id,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
      });

      return {
        success: fcmResponse.successCount > 0,
        notificationId: notification.id,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
        message:
          fcmResponse.successCount > 0
            ? 'Notification sent successfully'
            : 'Failed to send notification',
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        'Failed to send notification to user',
        error,
      );
      throw new InternalServerErrorException(
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
      );
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultiple(
    dto: SendNotificationToMultipleDto,
  ): Promise<SendNotificationResponseDto> {
    try {
      this.logger.log(this.logTag, 'Sending notification to multiple users', {
        userCount: dto.userIds.length,
        title: dto.title,
      });

      if (dto.userIds.length === 0) {
        throw new BadRequestException('At least one user ID is required');
      }

      const deviceTokens =
        await this.userDeviceRepository.getActiveDeviceTokensByUserIds(
          dto.userIds,
        );

      if (deviceTokens.length === 0) {
        this.logger.warn(this.logTag, 'No active devices found for users', {
          userIds: dto.userIds,
        });

        const notification = await this.notificationRepository.create({
          userId: null, // Multiple users, no single userId
          title: dto.title,
          body: dto.body,
          payload: { ...dto.data, targetUserIds: dto.userIds },
          status: NotificationStatus.FAILED,
          errorMessage: 'No active devices found',
          sentAt: new Date(),
        });

        return {
          success: false,
          notificationId: notification.id,
          successCount: 0,
          failureCount: 0,
          message: 'No active devices found for any user',
        };
      }

      const fcmResponse = await this.firebaseService.sendToDevices(
        deviceTokens,
        {
          title: dto.title,
          body: dto.body,
          data: dto.data,
        },
      );

      const status =
        fcmResponse.failureCount === 0
          ? NotificationStatus.SUCCESS
          : fcmResponse.successCount === 0
            ? NotificationStatus.FAILED
            : NotificationStatus.PARTIAL;

      const notification = await this.notificationRepository.create({
        userId: null,
        title: dto.title,
        body: dto.body,
        payload: { ...dto.data, targetUserIds: dto.userIds },
        status,
        fcmResponse: fcmResponse as unknown as Record<string, any>,
        sentAt: new Date(),
      });

      this.logger.log(this.logTag, 'Multi-user notification sent', {
        notificationId: notification.id,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
      });

      return {
        success: fcmResponse.successCount > 0,
        notificationId: notification.id,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
        message:
          fcmResponse.successCount > 0
            ? 'Notification sent successfully'
            : 'Failed to send notification',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        'Failed to send multi-user notification',
        error,
      );
      throw new InternalServerErrorException(
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
      );
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    dto: SendNotificationToTopicDto,
  ): Promise<SendNotificationResponseDto> {
    try {
      this.logger.log(this.logTag, 'Sending notification to topic', {
        topic: dto.topic,
        title: dto.title,
      });

      const fcmResponse = await this.firebaseService.sendToTopic(dto.topic, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });

      const notification = await this.notificationRepository.create({
        userId: null,
        title: dto.title,
        body: dto.body,
        payload: dto.data || null,
        topic: dto.topic,
        status: fcmResponse.success
          ? NotificationStatus.SUCCESS
          : NotificationStatus.FAILED,
        fcmResponse: fcmResponse as unknown as Record<string, any>,
        errorMessage: fcmResponse.error || null,
        sentAt: new Date(),
      });

      this.logger.log(this.logTag, 'Topic notification sent', {
        notificationId: notification.id,
        topic: dto.topic,
        success: fcmResponse.success,
      });

      return {
        success: fcmResponse.success,
        notificationId: notification.id,
        successCount: fcmResponse.success ? 1 : 0,
        failureCount: fcmResponse.success ? 0 : 1,
        message: fcmResponse.success
          ? 'Topic notification sent successfully'
          : fcmResponse.error || 'Failed to send topic notification',
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        'Failed to send topic notification',
        error,
      );
      throw new InternalServerErrorException(
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
      );
    }
  }

  /**
   * Subscribe user to a topic
   */
  async subscribeToTopic(
    userId: string,
    dto: TopicSubscriptionDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(this.logTag, 'Subscribing user to topic', {
        userId,
        topic: dto.topic,
      });

      const deviceTokens =
        await this.userDeviceRepository.getActiveDeviceTokensByUserId(userId);

      if (deviceTokens.length === 0) {
        return {
          success: false,
          message: 'No active devices found. Register a device first.',
        };
      }

      const result = await this.firebaseService.subscribeToTopic(
        deviceTokens,
        dto.topic,
      );

      this.logger.log(this.logTag, 'Topic subscription result', {
        userId,
        topic: dto.topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return {
        success: result.successCount > 0,
        message:
          result.successCount > 0
            ? `Subscribed ${result.successCount} device(s) to topic "${dto.topic}"`
            : 'Failed to subscribe to topic',
      };
    } catch (error) {
      this.logger.error(this.logTag, 'Failed to subscribe to topic', error);
      throw new InternalServerErrorException(
        NotificationErrorMessages.TOPIC_SUBSCRIPTION_FAILED,
      );
    }
  }

  /**
   * Unsubscribe user from a topic
   */
  async unsubscribeFromTopic(
    userId: string,
    dto: TopicSubscriptionDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(this.logTag, 'Unsubscribing user from topic', {
        userId,
        topic: dto.topic,
      });

      const deviceTokens =
        await this.userDeviceRepository.getActiveDeviceTokensByUserId(userId);

      if (deviceTokens.length === 0) {
        return {
          success: false,
          message: 'No active devices found.',
        };
      }

      const result = await this.firebaseService.unsubscribeFromTopic(
        deviceTokens,
        dto.topic,
      );

      this.logger.log(this.logTag, 'Topic unsubscription result', {
        userId,
        topic: dto.topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return {
        success: result.successCount > 0,
        message:
          result.successCount > 0
            ? `Unsubscribed ${result.successCount} device(s) from topic "${dto.topic}"`
            : 'Failed to unsubscribe from topic',
      };
    } catch (error) {
      this.logger.error(this.logTag, 'Failed to unsubscribe from topic', error);
      throw new InternalServerErrorException(
        NotificationErrorMessages.TOPIC_UNSUBSCRIPTION_FAILED,
      );
    }
  }

  /**
   * Get notification history for a user
   */
  async getUserNotificationHistory(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: ResponseNotificationDto[]; total: number }> {
    try {
      const result = await this.notificationRepository.findByUserId(
        userId,
        options,
      );

      return {
        data: plainToInstance(ResponseNotificationDto, result.data, {
          excludeExtraneousValues: true,
        }),
        total: result.total,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        'Failed to fetch notification history',
        error,
      );
      throw new InternalServerErrorException(
        NotificationErrorMessages.NOTIFICATION_FETCH_FAILED,
      );
    }
  }

  /**
   * Check if Firebase is configured
   */
  isFirebaseConfigured(): boolean {
    return this.firebaseService.isConfigured();
  }
}
