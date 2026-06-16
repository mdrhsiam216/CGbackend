import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { ILogger } from '../../interfaces/logger.interface';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import { NotificationErrorMessages } from '../../../shared/enums/messages.enums';
import { FirebaseService } from './firebase.service';
import { UserDevice } from '../../../modules/notification/entities/user-device.entity';
import {
  Notification,
  NotificationStatus,
} from '../../../modules/notification/entities/notification.entity';
import {
  PushNotificationResult,
  NotificationData,
} from '../interfaces/push-notification.interface';

/**
 * Push Notification Service
 *
 * Use this service to send push notifications from any module/service.
 *
 * @example
 * // In your service constructor:
 * constructor(
 *   private readonly pushNotificationService: PushNotificationService,
 * ) {}
 *
 * // Send notification when a message is received:
 * await this.pushNotificationService.sendToUser(
 *   receiverId,
 *   'New Message',
 *   `${senderName} sent you a message`,
 *   { type: 'chat_message', conversationId: 'xxx', senderId: 'xxx' }
 * );
 */
@Injectable()
export class PushNotificationService {
  private readonly logTag = ServiceTags.NOTIFICATION_SERVICE;

  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  /**
   * Send push notification to a single user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<PushNotificationResult> {
    try {
      // Get active device tokens for the user
      const devices = await this.userDeviceRepository.find({
        where: { userId, isActive: true },
      });

      const deviceTokens = devices.map((d) => d.deviceToken);

      if (deviceTokens.length === 0) {
        this.logger.log(this.logTag, 'No active devices found for user', {
          userId,
        });
        return { success: false, successCount: 0, failureCount: 0 };
      }

      // Send via Firebase
      const fcmResponse = await this.firebaseService.sendToDevices(
        deviceTokens,
        {
          title,
          body,
          data: data ? this.convertDataToStrings(data) : undefined,
        },
      );

      // Log notification to database
      const status =
        fcmResponse.failureCount === 0
          ? NotificationStatus.SUCCESS
          : fcmResponse.successCount === 0
            ? NotificationStatus.FAILED
            : NotificationStatus.PARTIAL;

      const notification = this.notificationRepository.create({
        userId,
        title,
        body,
        payload: data || null,
        status,
        sentAt: new Date(),
        fcmResponse: fcmResponse as unknown as Record<string, unknown>,
      });
      await this.notificationRepository.save(notification);

      this.logger.log(this.logTag, 'Push notification sent', {
        userId,
        title,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
      });

      return {
        success: fcmResponse.successCount > 0,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
        notificationId: notification.id,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
        error,
      );
      return { success: false, successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<PushNotificationResult> {
    try {
      if (userIds.length === 0) {
        return { success: false, successCount: 0, failureCount: 0 };
      }

      // Get active device tokens for all users
      const devices = await this.userDeviceRepository.find({
        where: { userId: In(userIds), isActive: true },
      });

      const deviceTokens = devices.map((d) => d.deviceToken);

      if (deviceTokens.length === 0) {
        this.logger.log(this.logTag, 'No active devices found for users', {
          userCount: userIds.length,
        });
        return { success: false, successCount: 0, failureCount: 0 };
      }

      // Send via Firebase
      const fcmResponse = await this.firebaseService.sendToDevices(
        deviceTokens,
        {
          title,
          body,
          data: data ? this.convertDataToStrings(data) : undefined,
        },
      );

      // Log notification to database
      const status =
        fcmResponse.failureCount === 0
          ? NotificationStatus.SUCCESS
          : fcmResponse.successCount === 0
            ? NotificationStatus.FAILED
            : NotificationStatus.PARTIAL;

      const notification = this.notificationRepository.create({
        userId: null, // Multiple users
        title,
        body,
        payload: { ...data, targetUserIds: userIds },
        status,
        sentAt: new Date(),
        fcmResponse: fcmResponse as unknown as Record<string, unknown>,
      });
      await this.notificationRepository.save(notification);

      this.logger.log(this.logTag, 'Push notification sent to multiple users', {
        userCount: userIds.length,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
      });

      return {
        success: fcmResponse.successCount > 0,
        successCount: fcmResponse.successCount,
        failureCount: fcmResponse.failureCount,
        notificationId: notification.id,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
        error,
      );
      return { success: false, successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<PushNotificationResult> {
    try {
      const fcmResponse = await this.firebaseService.sendToTopic(topic, {
        title,
        body,
        data: data ? this.convertDataToStrings(data) : undefined,
      });

      // Log notification to database
      const notification = this.notificationRepository.create({
        userId: null,
        title,
        body,
        payload: data || null,
        topic,
        status: fcmResponse.success
          ? NotificationStatus.SUCCESS
          : NotificationStatus.FAILED,
        sentAt: new Date(),
        fcmResponse: fcmResponse as unknown as Record<string, unknown>,
        errorMessage: fcmResponse.error || null,
      });
      await this.notificationRepository.save(notification);

      this.logger.log(this.logTag, 'Push notification sent to topic', {
        topic,
        success: fcmResponse.success,
      });

      return {
        success: fcmResponse.success,
        successCount: fcmResponse.success ? 1 : 0,
        failureCount: fcmResponse.success ? 0 : 1,
        notificationId: notification.id,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
        error,
      );
      return { success: false, successCount: 0, failureCount: 0 };
    }
  }

  // ============================================
  // Convenience Methods for Common Notifications
  // ============================================

  /**
   * Send new message notification
   */
  async notifyNewMessage(
    receiverId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
    senderId: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      receiverId,
      'New Message',
      `${senderName}: ${this.truncateText(messagePreview, 100)}`,
      {
        type: 'chat_message',
        conversationId,
        senderId,
      },
    );
  }

  /**
   * Send booking notification
   */
  async notifyBookingUpdate(
    userId: string,
    title: string,
    message: string,
    bookingId: string,
    bookingStatus: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(userId, title, message, {
      type: 'booking_update',
      bookingId,
      bookingStatus,
    });
  }

  /**
   * Send new booking request notification to caregiver
   */
  async notifyNewBookingRequest(
    caregiverId: string,
    clientName: string,
    bookingId: string,
    serviceDate: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      caregiverId,
      'New Booking Request',
      `${clientName} has requested a booking for ${serviceDate}`,
      {
        type: 'booking_request',
        bookingId,
        serviceDate,
      },
    );
  }

  /**
   * Send booking confirmation notification
   */
  async notifyBookingConfirmed(
    clientId: string,
    caregiverName: string,
    bookingId: string,
    serviceDate: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      clientId,
      'Booking Confirmed',
      `${caregiverName} has confirmed your booking for ${serviceDate}`,
      {
        type: 'booking_confirmed',
        bookingId,
        serviceDate,
      },
    );
  }

  /**
   * Send booking cancelled notification
   */
  async notifyBookingCancelled(
    userId: string,
    cancelledBy: string,
    bookingId: string,
    reason?: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      userId,
      'Booking Cancelled',
      reason
        ? `Your booking has been cancelled by ${cancelledBy}. Reason: ${reason}`
        : `Your booking has been cancelled by ${cancelledBy}`,
      {
        type: 'booking_cancelled',
        bookingId,
        cancelledBy,
        reason: reason || '',
      },
    );
  }

  /**
   * Notify client that their caregiver has clocked in (service has started)
   */
  async notifyCaregiversClockIn(
    clientId: string,
    caregiverName: string,
    caregiverId: string,
    bookingId: string,
    clockInTime: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      clientId,
      'Caregiver Has Arrived ',
      `${caregiverName} has clocked in and your service has started.`,
      {
        type: 'caregiver_clock_in',
        bookingId,
        caregiverId,
        caregiverName,
        clockInTime,
      },
    );
  }


  async notifyClockOutRequest(
    clientId: string,
    caregiverName: string,
    caregiverId: string,
    bookingId: string,
    proposedClockOutTime: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(
      clientId,
      'Caregiver is Requesting to Clock Out',
      `${caregiverName} has completed the session and is requesting to clock out. Please approve or decline.`,
      {
        type: 'caregiver_clock_out_request',
        bookingId,
        caregiverId,
        caregiverName,
        proposedClockOutTime,
      },
    );
  }

  async notifyClockOutResponse(
    caregiverUserId: string,
    action: 'accept' | 'decline',
    bookingId: string,
    clientName: string,
    clientId: string,
  ): Promise<PushNotificationResult> {
    const isAccepted = action === 'accept';
    return this.sendToUser(
      caregiverUserId,
      isAccepted ? 'Clock-Out Approved ' : 'Clock-Out Declined ',
      isAccepted
        ? `${clientName} has approved your clock-out. The session is now completed.`
        : `${clientName} has declined your clock-out request. Please continue the session.`,
      {
        type: 'caregiver_clock_out_response',
        bookingId,
        action,
        clientName,
        clientId,
      },
    );
  }

  /**
   * Send reminder notification
   */
  async notifyReminder(
    userId: string,
    title: string,
    message: string,
    reminderType: string,
    referenceId: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(userId, title, message, {
      type: 'reminder',
      reminderType,
      referenceId,
    });
  }

  /**
   * Send payment notification
   */
  async notifyPayment(
    userId: string,
    title: string,
    message: string,
    paymentId: string,
    amount: string,
    status: string,
  ): Promise<PushNotificationResult> {
    return this.sendToUser(userId, title, message, {
      type: 'payment',
      paymentId,
      amount,
      status,
    });
  }

  /**
   * Send profile verification notification
   */
  async notifyVerificationStatus(
    userId: string,
    status: 'approved' | 'rejected' | 'pending_review',
    verificationType: string,
    message?: string,
  ): Promise<PushNotificationResult> {
    const titles = {
      approved: 'Verification Approved',
      rejected: 'Verification Rejected',
      pending_review: 'Verification Under Review',
    };

    const defaultMessages = {
      approved: `Your ${verificationType} has been verified successfully.`,
      rejected: `Your ${verificationType} verification was not approved. Please check the requirements.`,
      pending_review: `Your ${verificationType} is currently under review.`,
    };

    return this.sendToUser(
      userId,
      titles[status],
      message || defaultMessages[status],
      {
        type: 'verification',
        verificationType,
        verificationStatus: status,
      },
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private convertDataToStrings(
    data: Record<string, unknown>,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  /**
   * Check if Firebase is configured
   */
  isConfigured(): boolean {
    return this.firebaseService.isConfigured();
  }
}
