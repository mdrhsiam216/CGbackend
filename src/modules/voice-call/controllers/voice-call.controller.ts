import { Controller, Query, Get } from '@nestjs/common';
import { VoiceCallService } from '../voice-call.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { VoiceCallSuccessMessages } from '../../../shared/enums';

@ApiTags('voice-call')
@Controller('voice-call')
export class VoiceCallController {
  constructor(private readonly voiceCallService: VoiceCallService) {}

  @Get('token')
  @ApiOperation({
    summary: 'Generate Twilio Voice access token for mobile app',
  })
  @ApiQuery({
    name: 'identity',
    required: false,
    description: 'User identity for the token',
  })
  @ApiQuery({
    name: 'platform',
    required: true,
    enum: ['android', 'ios'],
    description: 'Mobile platform',
  })
  async getToken(
    @Query('identity') identity: string,
    @Query('platform') platform: 'android' | 'ios',
  ) {
    const user = identity || 'user_' + Math.random().toString(36).substring(7);
    const validPlatform = platform === 'android' ? 'android' : 'ios';
    const token = await this.voiceCallService.generateToken(
      user,
      validPlatform,
    );
    return { identity: user, token };
  }
}
