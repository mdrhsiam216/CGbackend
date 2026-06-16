import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from '../services/chat.service';
import { TwilioConversationService } from '../services/twilio-conversation.service';
import { CustomLogger } from '../../../shared/services/custom-logger.service';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import {
  InvalidWebhookSignatureException,
  WebhookProcessingFailedException,
} from '../exceptions/chat.exceptions';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { WebhookSuccessMessages } from '../../../shared/enums';

@Controller('webhooks/twilio')
export class WebhookController {
  constructor(
    private readonly chatService: ChatService,
    private readonly twilioConversationService: TwilioConversationService,
    private readonly logger: CustomLogger,
  ) {}

  /**
   * Handle Twilio conversation webhook events
   * This endpoint receives message events from Twilio and saves them to the database
   */
  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(WebhookSuccessMessages.MESSAGE_SAVED)
  async handleMessageWebhook(
    @Body() body: Record<string, string>,
    @Headers('x-twilio-signature') twilioSignature: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        'Received Twilio webhook event',
        { eventType: body.EventType },
      );

      // Validate webhook signature
      // Note: In production, you should validate the signature
      // const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      // const isValid = this.twilioConversationService.validateWebhookSignature(
      //   twilioSignature,
      //   url,
      //   body,
      // );

      // if (!isValid) {
      //   this.logger.warn(
      //     ServiceTags.TWILIO_SERVICE,
      //     'Invalid Twilio webhook signature',
      //   );
      //   throw new InvalidWebhookSignatureException();
      // }

      // Process only message-added events
      if (body.EventType === 'onMessageAdded') {
        const conversationSid = body.ConversationSid;
        const messageSid = body.MessageSid;
        const messageBody = body.Body;
        const author = body.Author;

        if (!conversationSid || !messageSid || !messageBody || !author) {
          throw new BadRequestException('Missing required webhook parameters');
        }

        // Save message to database
        await this.chatService.saveMessageFromWebhook(
          conversationSid,
          messageSid,
          messageBody,
          author,
        );

        this.logger.log(
          ServiceTags.TWILIO_SERVICE,
          'Webhook event processed successfully',
          { messageSid },
        );

        return {
          success: true,
          message: 'Message saved successfully',
        };
      }

      // Acknowledge other event types without processing
      this.logger.log(
        ServiceTags.TWILIO_SERVICE,
        'Webhook event acknowledged (not processed)',
        { eventType: body.EventType },
      );

      return {
        success: true,
        message: 'Event acknowledged',
      };
    } catch (error) {
      this.logger.error(
        ServiceTags.TWILIO_SERVICE,
        'Failed to process Twilio webhook',
        error,
      );

      if (
        error instanceof InvalidWebhookSignatureException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new WebhookProcessingFailedException();
    }
  }
}
