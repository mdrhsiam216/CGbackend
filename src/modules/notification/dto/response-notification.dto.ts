import { Expose, Type } from 'class-transformer';
import { NotificationStatus } from '../entities/notification.entity';

export class ResponseNotificationDto {
  @Expose()
  id: string;

  @Expose()
  userId: string | null;

  @Expose()
  title: string;

  @Expose()
  body: string;

  @Expose()
  payload: Record<string, any> | null;

  @Expose()
  status: NotificationStatus;

  @Expose()
  topic: string | null;

  @Expose()
  @Type(() => Date)
  sentAt: Date | null;

  @Expose()
  @Type(() => Date)
  createdAt: Date;
}

export class ResponseDeviceDto {
  @Expose()
  id: string;

  @Expose()
  deviceType: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}

export class SendNotificationResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  notificationId: string;

  @Expose()
  successCount: number;

  @Expose()
  failureCount: number;

  @Expose()
  message: string;
}
