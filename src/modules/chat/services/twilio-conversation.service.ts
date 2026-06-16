import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { CustomLogger } from '../../../shared/services/custom-logger.service';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import {
  TwilioServiceException,
  TwilioConversationCreationFailedException,
  TwilioParticipantAddFailedException,
} from '../exceptions/chat.exceptions';

@Injectable()
export class TwilioConversationService {
  private readonly client: ReturnType<typeof twilio>;
  private readonly chatServiceSid: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.chatServiceSid = this.configService.get<string>(
      'TWILIO_CHAT_SERVICE_SID',
      '',
    );

    if (!accountSid || !authToken) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        'Missing Twilio account credentials',
      );
      throw new TwilioServiceException(
        'Twilio credentials are not configured properly',
      );
    }

    this.client = twilio(accountSid, authToken);
  }

  /**
   * Create a new Twilio conversation
   */
  async createConversation(
    uniqueName: string,
    friendlyName: string,
  ): Promise<string> {
    try {
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Creating Twilio conversation: ${uniqueName}`,
      );

      const conversation =
        await this.client.conversations.v1.conversations.create({
          uniqueName,
          friendlyName,
        });

      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Twilio conversation created successfully: ${conversation.sid}`,
      );

      return conversation.sid;
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        `Failed to create Twilio conversation: ${uniqueName}`,
        error,
      );
      throw new TwilioConversationCreationFailedException();
    }
  }

  /**
   * Add participant to a conversation
   */
  async addParticipant(
    conversationSid: string,
    identity: string,
  ): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Adding participant ${identity} to conversation ${conversationSid}`,
      );

      await this.client.conversations.v1
        .conversations(conversationSid)
        .participants.create({
          identity,
        });

      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Participant ${identity} added successfully to conversation ${conversationSid}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        `Failed to add participant ${identity} to conversation ${conversationSid}`,
        error,
      );
      throw new TwilioParticipantAddFailedException();
    }
  }

  /**
   * Get conversation by SID
   */
  async getConversation(conversationSid: string): Promise<any> {
    try {
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        `Fetching Twilio conversation: ${conversationSid}`,
      );

      const conversation = await this.client.conversations.v1
        .conversations(conversationSid)
        .fetch();

      return conversation;
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        `Failed to fetch Twilio conversation: ${conversationSid}`,
        error,
      );
      throw new TwilioServiceException(
        'Failed to fetch conversation from Twilio',
      );
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
  ): boolean {
    try {
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
      return twilio.validateRequest(authToken, signature, url, params);
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        'Failed to validate webhook signature',
        error,
      );
      return false;
    }
  }
}
