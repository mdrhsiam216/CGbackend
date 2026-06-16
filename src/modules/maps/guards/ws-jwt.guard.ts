import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtUser } from '../../auth/interfaces/auth.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const handshake = client.handshake;

    // Try to get token from query params (common for WebSocket)
    let token = handshake.query?.token as string;

    // If not in query, try auth header
    if (!token) {
      const authHeader = handshake.headers?.authorization as string;
      if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret =
        this.configService.get('JWT_ACCESS_SECRET') || 'default-jwt-secret';
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret,
      });

      // Attach user info to client for later use
      const user: JwtUser = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };

      client.data.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
