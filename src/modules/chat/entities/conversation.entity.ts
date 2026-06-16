import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('conversations')
@Index(['twilioConversationSid'], { unique: true })
@Unique(['bookingId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'twilio_conversation_sid' })
  twilioConversationSid: string;

  @Column({ type: 'uuid', name: 'participant_one_id' })
  participantOneId: string;

  @Column({ type: 'uuid', name: 'participant_two_id' })
  participantTwoId: string;

  @Column({ type: 'uuid', name: 'booking_id', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
