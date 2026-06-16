import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: Notification[]; total: number }> {
    const { limit = 20, offset = 0 } = options || {};

    const [data, total] = await this.repository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  async create(data: {
    userId?: string | null;
    title: string;
    body: string;
    payload?: Record<string, any> | null;
    status?: NotificationStatus;
    topic?: string | null;
    sentAt?: Date | null;
    fcmResponse?: Record<string, any> | null;
    errorMessage?: string | null;
  }): Promise<Notification> {
    const notification = this.repository.create({
      ...data,
      sentAt: data.sentAt ?? new Date(),
    });
    return this.repository.save(notification);
  }

  async update(notification: Notification): Promise<Notification> {
    return this.repository.save(notification);
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    fcmResponse?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    await this.repository.update(id, {
      status,
      fcmResponse: fcmResponse ?? null,
      errorMessage: errorMessage ?? null,
    });
  }

  async getRecentNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
