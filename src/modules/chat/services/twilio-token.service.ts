import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { CustomLogger } from '../../../shared/services/custom-logger.service';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import { TwilioTokenGenerationFailedException } from '../exceptions/chat.exceptions';

const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

@Injectable()
export class TwilioTokenService {
  private readonly accountSid: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly chatServiceSid: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    this.apiKey = this.configService.get<string>('TWILIO_API_KEY', '');
    this.apiSecret = this.configService.get<string>('TWILIO_API_SECRET', '');
    this.chatServiceSid = this.configService.get<string>(
      'TWILIO_CHAT_SERVICE_SID',
      '',
    );

    // Validate required configuration
    if (
      !this.accountSid ||
      !this.apiKey ||
      !this.apiSecret ||
      !this.chatServiceSid
    ) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        'Missing required Twilio configuration',
      );
    }
  }

  /**
   * Generate Twilio access token for a user
   */
  generateAccessToken(userId: string, identity: string): string {
    try {
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Generating access token for user: ${userId}`,
      );

      // Create access token with credentials
      const token = new AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        {
          identity,
          ttl: 3600, // 1 hour token validity
        },
      );

      // Create a chat grant
      const chatGrant = new ChatGrant({
        serviceSid: this.chatServiceSid,
      });

      // Add the grant to the token
      token.addGrant(chatGrant);

      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Access token generated successfully for user: ${userId}`,
      );

      return token.toJwt();
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        `Failed to generate access token for user: ${userId}`,
        error,
      );
      throw new TwilioTokenGenerationFailedException();
    }
  }

  /**
   * Validate Twilio configuration
   */
  isConfigured(): boolean {
    return !!(
      this.accountSid &&
      this.apiKey &&
      this.apiSecret &&
      this.chatServiceSid
    );
  }
}
