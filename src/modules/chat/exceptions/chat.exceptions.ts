import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatErrorMessages } from '../../../shared/enums/messages.enums';

export class ConversationNotFoundException extends NotFoundException {
  constructor() {
    super(ChatErrorMessages.CONVERSATION_NOT_FOUND);
  }
}

export class ConversationCreationFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.CONVERSATION_CREATION_FAILED);
  }
}

export class MessageNotFoundException extends NotFoundException {
  constructor() {
    super(ChatErrorMessages.MESSAGE_NOT_FOUND);
  }
}

export class MessageSendFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.MESSAGE_SEND_FAILED);
  }
}

export class UnauthorizedConversationAccessException extends UnauthorizedException {
  constructor() {
    super(ChatErrorMessages.UNAUTHORIZED_CONVERSATION_ACCESS);
  }
}

export class InvalidMessageContentException extends BadRequestException {
  constructor() {
    super(ChatErrorMessages.INVALID_MESSAGE_CONTENT);
  }
}

export class TwilioServiceException extends InternalServerErrorException {
  constructor(message?: string) {
    super(message || ChatErrorMessages.TWILIO_SERVICE_ERROR);
  }
}

export class TwilioTokenGenerationFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.TWILIO_TOKEN_GENERATION_FAILED);
  }
}

export class TwilioConversationCreationFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.TWILIO_CONVERSATION_CREATION_FAILED);
  }
}

export class TwilioParticipantAddFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.TWILIO_PARTICIPANT_ADD_FAILED);
  }
}

export class InvalidWebhookSignatureException extends UnauthorizedException {
  constructor() {
    super(ChatErrorMessages.INVALID_WEBHOOK_SIGNATURE);
  }
}

export class WebhookProcessingFailedException extends InternalServerErrorException {
  constructor() {
    super(ChatErrorMessages.WEBHOOK_PROCESSING_FAILED);
  }
}
