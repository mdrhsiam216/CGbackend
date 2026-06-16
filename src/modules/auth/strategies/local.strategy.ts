import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces/auth.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Can be email or phone
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials
   * Supports both email and phone number login
   */
  async validate(
    emailOrPhone: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.authService.validateUser(emailOrPhone, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
