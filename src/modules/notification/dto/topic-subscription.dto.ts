import { IsString, IsNotEmpty } from 'class-validator';

export class TopicSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  topic: string;
}
