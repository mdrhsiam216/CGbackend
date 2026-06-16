import { ApiProperty } from '@nestjs/swagger';

class MessageSenderDto {
  @ApiProperty({ description: 'Sender ID' })
  id: string;

  @ApiProperty({ description: 'Sender full name' })
  fullName: string;

  @ApiProperty({ description: 'Sender email' })
  email: string;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Sender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  senderId: string;

  @ApiProperty({
    description:
      'Message content (AES-256-GCM encrypted, base64). Decrypt on the frontend using the same key as the backend (CHAT_MESSAGE_ENCRYPTION_KEY).',
    example: 'dGVzdC1pdi10YWctY2lwaGVydGV4dA==',
  })
  content: string;

  @ApiProperty({ description: 'Is message seen', example: true })
  seen: boolean;

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: 'Sender details', type: MessageSenderDto })
  sender: {
    id: string;
    fullName: string;
    email: string;
  };
}

export class PaginatedMessagesResponseDto {
  @ApiProperty({ description: 'List of messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total number of messages', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 50 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 2 })
  totalPages: number;
}
