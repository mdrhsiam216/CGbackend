import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { jwt } from 'twilio';
import { User } from '../user/entities/user.entity';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import { VoiceCallErrorMessages } from '../../shared/enums/messages.enums';
import type { ILogger } from '../../shared/interfaces/logger.interface';

@Injectable()
export class VoiceCallService {
  private readonly logTag = ServiceTags.VOICE_CALL_SERVICE;

  constructor(
    private configService: ConfigService,
    @Inject('ILogger') private readonly logger: ILogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async generateToken(
    identity: string,
    platform: 'android' | 'ios',
  ): Promise<string> {
    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const apiKeySid = this.configService.get<string>('TWILIO_API_KEY');
      const apiKeySecret = this.configService.get<string>('TWILIO_API_SECRET');
      const twimlAppSid = this.configService.get<string>(
        'TWILIO_TWIML_APP_SID',
      );

      // Get platform-specific push credential SID
      const pushSid =
        platform === 'ios'
          ? this.configService.get<string>('TWILIO_PUSH_CREDENTIAL_SID_IOS')
          : this.configService.get<string>(
              'TWILIO_PUSH_CREDENTIAL_SID_ANDROID',
            );

      if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
        this.logger.error(this.logTag, 'Missing Twilio credentials', {
          accountSid: !!accountSid,
          apiKeySid: !!apiKeySid,
          apiKeySecret: !!apiKeySecret,
          twimlAppSid: !!twimlAppSid,
        });
        throw new InternalServerErrorException(
          VoiceCallErrorMessages.TWILIO_CREDENTIALS_NOT_CONFIGURED,
        );
      }

      this.logger.log(this.logTag, 'Generating voice call token', {
        accountSid: accountSid.substring(0, 8) + '...',
        apiKeySid: apiKeySid.substring(0, 8) + '...',
        twimlAppSid: twimlAppSid,
        identity: identity,
        platform,
      });

      const AccessToken = jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      const user = await this.userRepository.findOne({
        where: { id: identity },
        relations: ['clientProfile', 'caregiverProfile'],
      });

      if (!user) {
        this.logger.warn(
          this.logTag,
          'User not found for voice token generation',
          { identity },
        );
      }

      let finalPushSid = pushSid;
      if (user?.clientProfile) {
        finalPushSid =
          this.configService.get<string>('COM_HELPXCARE_CLIENT_PUSH_CRED') ||
          finalPushSid;
      } else if (user?.caregiverProfile) {
        finalPushSid =
          this.configService.get<string>('COM_HELPXCARE_PROVIDER_Push_CRED') ||
          finalPushSid;
      }

      if (!finalPushSid) {
        this.logger.error(this.logTag, 'Missing Push Credential SID', {
          platform,
          identity,
        });
        throw new InternalServerErrorException(
          VoiceCallErrorMessages.TWILIO_CREDENTIALS_NOT_CONFIGURED,
        );
      }

      const voiceGrantOptions: any = {
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
        pushCredentialSid: finalPushSid,
      };

      const voiceGrant = new VoiceGrant(voiceGrantOptions);

      const token = new AccessToken(accountSid!, apiKeySid!, apiKeySecret!, {
        identity: identity,
        ttl: 3600,
      });

      token.addGrant(voiceGrant);

      const jwtToken = token.toJwt();

      try {
        const parts = jwtToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        this.logger.log(
          this.logTag,
          'Voice call token generated successfully',
          {
            iss: payload.iss,
            sub: payload.sub,
            identity: payload.grants?.identity,
            outgoingAppSid: payload.grants?.voice?.outgoing?.application_sid,
          },
        );
      } catch (e) {
        this.logger.warn(this.logTag, 'Could not decode token for debugging');
      }

      return jwtToken;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(this.logTag, 'Failed to generate voice call token', {
        error: error.message,
      });
      throw new InternalServerErrorException(
        VoiceCallErrorMessages.VOICE_CALL_TOKEN_GENERATION_FAILED,
      );
    }
  }
}
