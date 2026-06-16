import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  IJwtTokenService,
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
  AuthenticatedUser,
} from '../interfaces/auth.interface';

@Injectable()
export class JwtTokenService implements IJwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_ACCESS_SECRET') || 'default-jwt-secret',
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
    });
  }

  /**
   * Generate refresh token (long-lived, more secure)
   */
  generateRefreshToken(userId: string): string {
    const payload = { sub: userId, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: AuthenticatedUser): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(user.id),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Generate secure random token for additional security
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Get token expiry date for refresh tokens
   */
  getRefreshTokenExpiry(): Date {
    const expiryDays = this.configService.get('JWT_REFRESH_EXPIRY_DAYS', 7);
    return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
