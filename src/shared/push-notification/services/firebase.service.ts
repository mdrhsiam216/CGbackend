import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { ILogger } from '../../interfaces/logger.interface';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import { NotificationErrorMessages } from '../../../shared/enums/messages.enums';
import {
  FirebaseSendResponse,
  NotificationPayload,
} from '../interfaces/push-notification.interface';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logTag = ServiceTags.FIREBASE_SERVICE;
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (this.isInitialized || admin.apps.length > 0) {
      this.isInitialized = true;
      return;
    }

    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          this.logTag,
          NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
          {
            projectId: !!projectId,
            clientEmail: !!clientEmail,
            privateKey: !!privateKey,
          },
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Handle escaped newlines in private key
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });

      this.isInitialized = true;
      this.logger.log(
        this.logTag,
        'Firebase Admin SDK initialized successfully',
      );
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
        error,
      );
    }
  }

  isConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Send notification to multiple device tokens
   */
  async sendToDevices(
    deviceTokens: string[],
    payload: NotificationPayload,
  ): Promise<FirebaseSendResponse> {
    if (!this.isInitialized) {
      this.logger.warn(
        this.logTag,
        NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        responses: deviceTokens.map(() => ({
          success: false,
          error: {
            code: 'not-initialized',
            message: NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
          },
        })),
      };
    }

    if (deviceTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        responses: [],
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data
          ? this.convertDataToStrings(payload.data)
          : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(this.logTag, 'Notifications sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: deviceTokens.length,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((res) => ({
          success: res.success,
          messageId: res.messageId,
          error: res.error
            ? {
                code: res.error.code,
                message: res.error.message,
              }
            : undefined,
        })),
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
        error,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        responses: deviceTokens.map(() => ({
          success: false,
          error: {
            code: 'send-failed',
            message:
              error instanceof Error
                ? error.message
                : NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
          },
        })),
      };
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isInitialized) {
      this.logger.warn(
        this.logTag,
        NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
      );
      return {
        success: false,
        error: NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
      };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data
          ? this.convertDataToStrings(payload.data)
          : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);

      this.logger.log(this.logTag, 'Topic notification sent', {
        topic,
        messageId,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
        error,
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : NotificationErrorMessages.NOTIFICATION_SEND_FAILED,
      };
    }
  }

  /**
   * Subscribe device tokens to a topic
   */
  async subscribeToTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized) {
      this.logger.warn(
        this.logTag,
        NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
      };
    }

    if (deviceTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
      };
    }

    try {
      const response = await admin
        .messaging()
        .subscribeToTopic(deviceTokens, topic);

      this.logger.log(this.logTag, 'Subscribed to topic', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.TOPIC_SUBSCRIPTION_FAILED,
        error,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
      };
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   */
  async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized) {
      this.logger.warn(
        this.logTag,
        NotificationErrorMessages.FIREBASE_NOT_CONFIGURED,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
      };
    }

    if (deviceTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
      };
    }

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(deviceTokens, topic);

      this.logger.log(this.logTag, 'Unsubscribed from topic', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        this.logTag,
        NotificationErrorMessages.TOPIC_UNSUBSCRIPTION_FAILED,
        error,
      );
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
      };
    }
  }

  /**
   * Convert data object to string values (FCM requires string values)
   */
  private convertDataToStrings(
    data: Record<string, unknown>,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }
}
