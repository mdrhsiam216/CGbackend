import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { Auth } from '../entities/auth.entity';
import {
  IAuthSessionsRepository,
  AuthSession,
} from '../interfaces/auth.interface';

@Injectable()
export class AuthSessionsRepository implements IAuthSessionsRepository {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  async createSession(sessionData: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
  }): Promise<AuthSession> {
    const session = this.authRepository.create({
      userId: sessionData.userId,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      deviceName: sessionData.deviceName,
      isActive: true,
      lastUsedAt: new Date(),
    });

    const savedSession = await this.authRepository.save(session);
    return this.mapEntityToInterface(savedSession);
  }

  async findSessionByToken(refreshToken: string): Promise<AuthSession | null> {
    const session = await this.authRepository.findOne({
      where: {
        refreshToken,
        isActive: true,
      },
    });

    return session ? this.mapEntityToInterface(session) : null;
  }

  async findSessionsByUserId(
    userId: string,
    includeInactive = false,
  ): Promise<AuthSession[]> {
    const whereCondition: FindOptionsWhere<Auth> = { userId };

    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    const sessions = await this.authRepository.find({
      where: whereCondition,
      order: { lastUsedAt: 'DESC' },
    });

    return sessions.map((session) => this.mapEntityToInterface(session));
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await this.authRepository.update(
      { id: sessionId, isActive: true },
      { lastUsedAt: new Date() },
    );
  }

  async deactivateSession(refreshToken: string): Promise<void> {
    await this.authRepository.update({ refreshToken }, { isActive: false });
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.authRepository.update({ userId }, { isActive: false });
  }

  async removeExpiredSessions(): Promise<number> {
    const result = await this.authRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  async findSessionById(sessionId: string): Promise<AuthSession | null> {
    const session = await this.authRepository.findOne({
      where: {
        id: sessionId,
        isActive: true,
      },
    });

    return session ? this.mapEntityToInterface(session) : null;
  }

  private mapEntityToInterface(entity: Auth): AuthSession {
    return {
      id: entity.id,
      userId: entity.userId,
      refreshToken: entity.refreshToken,
      expiresAt: entity.expiresAt,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      deviceName: entity.deviceName,
      isActive: entity.isActive,
      lastUsedAt: entity.lastUsedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
