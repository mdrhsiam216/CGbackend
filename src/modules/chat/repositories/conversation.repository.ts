import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(private readonly dataSource: DataSource) {
    super(Conversation, dataSource.createEntityManager());
  }

  async findByBookingId(bookingId: string): Promise<Conversation | null> {
    return await this.findOne({
      where: { bookingId },
      relations: ['booking'],
    });
  }

  async findByTwilioSid(
    twilioConversationSid: string,
  ): Promise<Conversation | null> {
    return await this.findOne({ where: { twilioConversationSid } });
  }

  async createConversation(
    participantOneId: string,
    participantTwoId: string,
    twilioConversationSid: string,
    bookingId: string,
  ): Promise<Conversation> {
    const conversation = this.create({
      participantOneId,
      participantTwoId,
      twilioConversationSid,
      bookingId,
    });

    return await this.save(conversation);
  }

  /**
   * Find conversations for a user that have active bookings (confirmed/in_progress)
   */
  async findActiveByUserId(userId: string): Promise<Conversation[]> {
    return await this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.booking', 'booking')
      .where(
        '(conversation.participant_one_id = :userId OR conversation.participant_two_id = :userId)',
        { userId },
      )
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'in_progress'],
      })
      .orderBy('conversation.updated_at', 'DESC')
      .getMany();
  }

  async findByIdAndUserId(
    conversationId: string,
    userId: string,
  ): Promise<Conversation | null> {
    return await this.createQueryBuilder('conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .andWhere(
        '(conversation.participant_one_id = :userId OR conversation.participant_two_id = :userId)',
        { userId },
      )
      .getOne();
  }

  async deleteByBookingId(bookingId: string): Promise<void> {
    await this.createQueryBuilder()
      .delete()
      .from(Conversation)
      .where('booking_id = :bookingId', { bookingId })
      .execute();
  }
}
