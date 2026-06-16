import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TwilioWebhookDto {
  @IsString()
  @IsNotEmpty()
  ConversationSid: string;

  @IsString()
  @IsNotEmpty()
  MessageSid: string;

  @IsString()
  @IsNotEmpty()
  Body: string;

  @IsString()
  @IsNotEmpty()
  Author: string;

  @IsString()
  @IsOptional()
  EventType?: string;

  @IsString()
  @IsOptional()
  ParticipantSid?: string;

  @IsString()
  @IsOptional()
  DateCreated?: string;
}
