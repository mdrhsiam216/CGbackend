export interface PushNotificationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  notificationId?: string;
}

export interface NotificationData {
  type: string;
  [key: string]: string | number | boolean | object;
}

export interface FirebaseSendResponse {
  successCount: number;
  failureCount: number;
  responses: Array<{
    success: boolean;
    messageId?: string;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}
