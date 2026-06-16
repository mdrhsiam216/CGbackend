import { ApiProperty } from '@nestjs/swagger';

export class TwilioTokenResponseDto {
  @ApiProperty({ description: 'Twilio access token' })
  token: string;

  @ApiProperty({ description: 'User identity for Twilio' })
  identity: string;
}
