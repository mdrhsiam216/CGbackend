import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../../shared/services/custom-logger.service';
import { PushNotificationService } from '../../../shared/push-notification';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { MessageEncryptionService } from './message-encryption.service';
import { TwilioTokenService } from './twilio-token.service';
import { TwilioConversationService } from './twilio-conversation.service';
import { User } from '../../user/entities/user.entity';
import {
  ConversationNotFoundException,
  UnauthorizedConversationAccessException,
  ConversationCreationFailedException,
  MessageSendFailedException,
  MessageNotFoundException,
} from '../exceptions/chat.exceptions';
import {
  UserErrorMessages,
  BookingErrorMessages,
} from '../../../shared/enums/messages.enums';
import {
  ConversationResponseDto,
  ConversationWithParticipantDto,
} from '../dto/conversation-response.dto';
import {
  MessageResponseDto,
  PaginatedMessagesResponseDto,
} from '../dto/message-response.dto';
import { TwilioTokenResponseDto } from '../dto/token-response.dto';
import { Booking } from '../../bookings/entities/booking.entity';
import { BookingStatus } from '../../bookings/enums';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly messageEncryption: MessageEncryptionService,
    private readonly twilioTokenService: TwilioTokenService,
    private readonly twilioConversationService: TwilioConversationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly logger: CustomLogger,
    private readonly pushNotificationService: PushNotificationService,
  ) { }

  async generateAccessToken(userId: string): Promise<TwilioTokenResponseDto> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Generating Twilio access token for user: ${userId}`,
      );

      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      const identity = userId;
      const token = this.twilioTokenService.generateAccessToken(
        userId,
        identity,
      );

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Access token generated successfully for user: ${userId}`,
      );

      return { token, identity };
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to generate access token for user: ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create or get conversation for a specific booking.
   * Each booking gets exactly one conversation. The booking must be active
   * (confirmed/in_progress) and the user must be a participant.
   */
  async createOrGetConversation(
    currentUserId: string,
    bookingId: string,
  ): Promise<ConversationResponseDto> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Creating/retrieving conversation for booking: ${bookingId}, user: ${currentUserId}`,
      );

      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['caregiver', 'caregiver.user'],
      });

      if (!booking) {
        throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
      }

      if (
        booking.status !== BookingStatus.CONFIRMED &&
        booking.status !== BookingStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Chat is only available for confirmed or in-progress bookings.',
        );
      }

      const caregiverUserId = booking.caregiver?.user?.id;
      const clientUserId = booking.userId;

      if (currentUserId !== clientUserId && currentUserId !== caregiverUserId) {
        throw new UnauthorizedConversationAccessException();
      }

      const existingConversation =
        await this.conversationRepository.findByBookingId(bookingId);

      if (existingConversation) {
        this.logger.log(
          ServiceTags.CHAT_SERVICE,
          `Existing conversation found for booking ${bookingId}: ${existingConversation.id}`,
        );

        return this.toConversationResponse(existingConversation, booking);
      }

      const uniqueName = `conv_booking_${bookingId}_${Date.now()}`;
      const friendlyName = `${booking.serviceType} - ${booking.date}`;

      const twilioConversationSid =
        await this.twilioConversationService.createConversation(
          uniqueName,
          friendlyName,
        );

      await this.twilioConversationService.addParticipant(
        twilioConversationSid,
        clientUserId,
      );
      await this.twilioConversationService.addParticipant(
        twilioConversationSid,
        caregiverUserId,
      );

      const conversation = await this.conversationRepository.createConversation(
        clientUserId,
        caregiverUserId,
        twilioConversationSid,
        bookingId,
      );

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `New conversation created for booking ${bookingId}: ${conversation.id}`,
      );

      return this.toConversationResponse(conversation, booking);
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to create/get conversation for booking: ${bookingId}`,
        error,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedConversationAccessException ||
        error.name === 'TwilioConversationCreationFailedException' ||
        error.name === 'TwilioParticipantAddFailedException'
      ) {
        throw error;
      }

      throw new ConversationCreationFailedException();
    }
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedMessagesResponseDto> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Fetching messages for conversation: ${conversationId}, user: ${userId}`,
      );

      const conversation = await this.conversationRepository.findByIdAndUserId(
        conversationId,
        userId,
      );

      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const result = await this.messageRepository.findByConversationId(
        conversationId,
        page,
        limit,
      );

      const messages: MessageResponseDto[] = result.messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        seen: message.seen,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          fullName: this.formatUserName(message.sender),
          email: message.sender.email,
        },
      }));

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Retrieved ${messages.length} messages for conversation: ${conversationId}`,
      );

      return {
        messages,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to fetch messages for conversation: ${conversationId}`,
        error,
      );
      throw error;
    }
  }

  async saveMessageFromWebhook(
    twilioConversationSid: string,
    twilioMessageSid: string,
    content: string,
    senderIdentity: string,
  ): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Saving message from webhook for conversation: ${twilioConversationSid}`,
      );

      const conversation = await this.conversationRepository.findByTwilioSid(
        twilioConversationSid,
      );

      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const senderId = senderIdentity;
      if (
        senderId !== conversation.participantOneId &&
        senderId !== conversation.participantTwoId
      ) {
        throw new UnauthorizedConversationAccessException();
      }

      const existingMessage =
        await this.messageRepository.findByTwilioMessageSid(twilioMessageSid);

      if (existingMessage) {
        this.logger.log(
          ServiceTags.CHAT_SERVICE,
          `Message already exists: ${twilioMessageSid}`,
        );
        return;
      }

      const contentToStore = this.messageEncryption.looksEncrypted(content)
        ? content
        : this.messageEncryption.encrypt(content);

      await this.messageRepository.createMessage(
        conversation.id,
        senderId,
        contentToStore,
        twilioMessageSid,
      );

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Message saved successfully: ${twilioMessageSid}`,
      );

      const receiverId =
        senderId === conversation.participantOneId
          ? conversation.participantTwoId
          : conversation.participantOneId;

      const sender = await this.userRepository.findOne({
        where: { id: senderId },
        select: ['id', 'firstName', 'lastName'],
      });

      const senderName = this.formatUserName(sender, 'Someone');

      let notificationBody = contentToStore;
      try {
        if (this.messageEncryption.looksEncrypted(contentToStore)) {
          notificationBody = this.messageEncryption.decrypt(contentToStore);
        }
      } catch {
        notificationBody = 'New message';
      }

      this.pushNotificationService
        .notifyNewMessage(
          receiverId,
          senderName,
          notificationBody,
          conversation.id,
          senderId,
        )
        .catch((error) => {
          this.logger.error(
            ServiceTags.CHAT_SERVICE,
            `Failed to send push notification for message: ${twilioMessageSid}`,
            error,
          );
        });
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to save message from webhook: ${twilioMessageSid}`,
        error,
      );
      throw new MessageSendFailedException();
    }
  }

  /**
   * Get all active conversations for a user.
   * Only returns conversations whose bookings are confirmed or in_progress.
   */
  async getUserConversations(
    userId: string,
  ): Promise<ConversationWithParticipantDto[]> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Fetching active conversations for user: ${userId}`,
      );

      const conversations =
        await this.conversationRepository.findActiveByUserId(userId);

      const results: ConversationWithParticipantDto[] = [];

      for (const conv of conversations) {
        const otherParticipantId =
          conv.participantOneId === userId
            ? conv.participantTwoId
            : conv.participantOneId;

        const otherParticipant = await this.userRepository.findOne({
          where: { id: otherParticipantId },
          select: ['id', 'firstName', 'lastName', 'email'],
        });

        const unreadCount = await this.messageRepository.getUnreadCount(
          conv.id,
          userId,
        );

        const lastMessage = await this.messageRepository.getLastMessage(
          conv.id,
        );

        results.push({
          id: conv.id,
          twilioConversationSid: conv.twilioConversationSid,
          participantOneId: conv.participantOneId,
          participantTwoId: conv.participantTwoId,
          bookingId: conv.bookingId,
          booking: conv.booking
            ? {
              id: conv.booking.id,
              serviceType: conv.booking.serviceType,
              date: conv.booking.date,
              status: conv.booking.status,
            }
            : undefined,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          otherParticipant: otherParticipant
            ? {
              id: otherParticipant.id,
              fullName: this.formatUserName(otherParticipant),
              email: otherParticipant.email,
            }
            : {
              id: otherParticipantId,
              fullName: 'Unknown User',
              email: '',
            },
          unreadCount,
          lastMessage: lastMessage
            ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
            : undefined,
        });
      }

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Retrieved ${results.length} active conversations for user: ${userId}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to fetch conversations for user: ${userId}`,
        error,
      );
      throw error;
    }
  }

  async markMessagesAsSeen(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Marking messages as seen for conversation: ${conversationId}, user: ${userId}`,
      );

      const conversation = await this.conversationRepository.findByIdAndUserId(
        conversationId,
        userId,
      );

      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      await this.messageRepository.markMessagesAsSeen(conversationId, userId);

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Messages marked as seen for conversation: ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to mark messages as seen for conversation: ${conversationId}`,
        error,
      );
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Deleting message: ${messageId}, user: ${userId}`,
      );

      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        throw new MessageNotFoundException();
      }

      if (message.senderId !== userId) {
        throw new UnauthorizedConversationAccessException();
      }

      const conversation = await this.conversationRepository.findByIdAndUserId(
        message.conversationId,
        userId,
      );

      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      await this.messageRepository.deleteMessage(messageId);

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Message deleted successfully: ${messageId}`,
      );
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to delete message: ${messageId}`,
        error,
      );
      throw error;
    }
  }

  async searchMessages(
    userId: string,
    searchQuery: string,
    conversationId?: string,
  ): Promise<MessageResponseDto[]> {
    try {
      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Searching messages for user: ${userId}, query: ${searchQuery}`,
      );

      const messages = await this.messageRepository.searchMessages(
        userId,
        searchQuery,
        conversationId,
      );

      const messageDtos: MessageResponseDto[] = messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        seen: message.seen,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          fullName: this.formatUserName(message.sender),
          email: message.sender.email,
        },
      }));

      this.logger.log(
        ServiceTags.CHAT_SERVICE,
        `Found ${messageDtos.length} messages matching query`,
      );

      return messageDtos;
    } catch (error) {
      this.logger.error(
        ServiceTags.CHAT_SERVICE,
        `Failed to search messages for user: ${userId}`,
        error,
      );
      throw error;
    }
  }

  private toConversationResponse(
    conversation: {
      id: string;
      twilioConversationSid: string;
      participantOneId: string;
      participantTwoId: string;
      bookingId: string;
      createdAt: Date;
      updatedAt: Date;
    },
    booking: Booking,
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      twilioConversationSid: conversation.twilioConversationSid,
      participantOneId: conversation.participantOneId,
      participantTwoId: conversation.participantTwoId,
      bookingId: conversation.bookingId,
      booking: {
        id: booking.id,
        serviceType: booking.serviceType,
        date: booking.date,
        status: booking.status,
      },
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private formatUserName(
    user: { firstName?: string; lastName?: string } | null | undefined,
    fallback = 'Unknown User',
  ): string {
    if (!user) return fallback;
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    return user.firstName || user.lastName || fallback;
  }
}
