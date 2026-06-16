import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';
import { TwilioTokenService } from './services/twilio-token.service';
import { TwilioConversationService } from './services/twilio-conversation.service';
import { MessageEncryptionService } from './services/message-encryption.service';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { WebhookController } from './controllers/webhook.controller';
import { CustomLogger } from '../../shared/services/custom-logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Conversation, Message, User, Booking]),
    AuthModule,
  ],
  controllers: [ChatController, WebhookController],
  providers: [
    ChatService,
    MessageEncryptionService,
    ConversationRepository,
    MessageRepository,
    TwilioTokenService,
    TwilioConversationService,
    CustomLogger,
  ],
  exports: [ChatService],
})
export class ChatModule {}
