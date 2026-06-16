import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BookingSummaryDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Service type', example: 'Elderly Care' })
  serviceType: string;

  @ApiProperty({ description: 'Booking date', example: '2025-12-25' })
  date: string;

  @ApiProperty({ description: 'Booking status', example: 'confirmed' })
  status: string;
}

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Twilio Conversation SID',
    example: 'CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  })
  twilioConversationSid: string;

  @ApiProperty({
    description: 'Participant One ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  participantOneId: string;

  @ApiProperty({
    description: 'Participant Two ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  participantTwoId: string;

  @ApiProperty({
    description: 'Booking ID this conversation is tied to',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  bookingId: string;

  @ApiPropertyOptional({
    description: 'Booking summary',
    type: BookingSummaryDto,
  })
  booking?: {
    id: string;
    serviceType: string;
    date: string;
    status: string;
  };

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

class ParticipantDto {
  @ApiProperty({ description: 'Participant ID' })
  id: string;

  @ApiProperty({ description: 'Participant full name' })
  fullName: string;

  @ApiProperty({ description: 'Participant email' })
  email: string;
}

class LastMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({
    description:
      'Message content (encrypted, base64). Decrypt on the frontend with the same key as the backend.',
  })
  content: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Sender ID' })
  senderId: string;
}

export class ConversationWithParticipantDto extends ConversationResponseDto {
  @ApiProperty({
    description: 'Other participant details',
    type: ParticipantDto,
  })
  otherParticipant: {
    id: string;
    fullName: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Unread message count', example: 5 })
  unreadCount?: number;

  @ApiPropertyOptional({
    description: 'Last message details',
    type: LastMessageDto,
  })
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  };
}
