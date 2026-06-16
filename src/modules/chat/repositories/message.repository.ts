import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private readonly dataSource: DataSource) {
    super(Message, dataSource.createEntityManager());
  }

  /**
   * Create a new message
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    twilioMessageSid?: string,
  ): Promise<Message> {
    const message = this.create({
      conversationId,
      senderId,
      content,
      twilioMessageSid,
      seen: false,
    });

    return await this.save(message);
  }

  /**
   * Find messages by conversation ID with pagination
   */
  async findByConversationId(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedMessages> {
    const skip = (page - 1) * limit;

    const [messages, total] = await this.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark messages as seen
   */
  async markMessagesAsSeen(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(Message)
      .set({ seen: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('seen = :seen', { seen: false })
      .execute();
  }

  /**
   * Find message by Twilio message SID
   */
  async findByTwilioMessageSid(
    twilioMessageSid: string,
  ): Promise<Message | null> {
    return await this.findOne({ where: { twilioMessageSid } });
  }

  /**
   * Get unread message count for a conversation (messages not sent by the user)
   */
  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    return await this.createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.seen = :seen', { seen: false })
      .andWhere('message.sender_id != :userId', { userId })
      .getCount();
  }

  /**
   * Get the last message in a conversation
   */
  async getLastMessage(conversationId: string): Promise<Message | null> {
    return await this.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
    });
  }

  /**
   * Find message by ID
   */
  async findById(messageId: string): Promise<Message | null> {
    return await this.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.delete(messageId);
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    userId: string,
    searchQuery: string,
    conversationId?: string,
  ): Promise<Message[]> {
    const queryBuilder = this.createQueryBuilder('message')
      .leftJoin('message.conversation', 'conversation')
      .leftJoinAndSelect('message.sender', 'sender')
      .where(
        '(conversation.participant_one_id = :userId OR conversation.participant_two_id = :userId)',
        { userId },
      )
      .andWhere('message.content ILIKE :searchQuery', {
        searchQuery: `%${searchQuery}%`,
      })
      .orderBy('message.created_at', 'DESC')
      .take(50); // Limit to 50 results

    if (conversationId) {
      queryBuilder.andWhere('message.conversation_id = :conversationId', {
        conversationId,
      });
    }

    return await queryBuilder.getMany();
  }
}
