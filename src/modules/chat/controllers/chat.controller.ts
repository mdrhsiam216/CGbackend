import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import {
  ChatSuccessMessages,
  ChatOperationSummaries,
  ChatResponseMessages,
} from '../../../shared/enums';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import {
  ConversationResponseDto,
  ConversationWithParticipantDto,
} from '../dto/conversation-response.dto';
import {
  PaginatedMessagesResponseDto,
  MessageResponseDto,
} from '../dto/message-response.dto';
import { TwilioTokenResponseDto } from '../dto/token-response.dto';
import { GetMessagesQueryDto } from '../dto/get-messages-query.dto';
import { SearchMessagesQueryDto } from '../dto/search-messages-query.dto';
import type { JwtUser } from '../../auth/interfaces/auth.interface';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get Twilio access token for the authenticated user
   */
  @Get('token')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.TWILIO_ACCESS_TOKEN_GENERATED)
  @ApiOperation({ summary: ChatOperationSummaries.GET_TOKEN })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.TWILIO_ACCESS_TOKEN_GENERATED,
    type: TwilioTokenResponseDto,
  })
  async getAccessToken(
    @CurrentUser() user: JwtUser,
  ): Promise<TwilioTokenResponseDto> {
    return await this.chatService.generateAccessToken(user.userId);
  }

  /**
   * Create or get existing conversation with another user
   */
  @Post('conversation')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.CONVERSATION_RETRIEVED)
  @ApiOperation({ summary: ChatOperationSummaries.CREATE_OR_GET_CONVERSATION })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.CONVERSATION_RETRIEVED,
    type: ConversationResponseDto,
  })
  async createOrGetConversation(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return await this.chatService.createOrGetConversation(
      user.userId,
      dto.bookingId,
    );
  }

  /**
   * Get all conversations for the authenticated user
   */
  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.CONVERSATIONS_RETRIEVED)
  @ApiOperation({ summary: ChatOperationSummaries.GET_USER_CONVERSATIONS })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.CONVERSATIONS_RETRIEVED,
    type: [ConversationWithParticipantDto],
  })
  async getUserConversations(
    @CurrentUser() user: JwtUser,
  ): Promise<ConversationWithParticipantDto[]> {
    return await this.chatService.getUserConversations(user.userId);
  }

  /**
   * Get paginated messages for a conversation
   */
  @Get('conversation/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.MESSAGES_RETRIEVED)
  @ApiOperation({ summary: ChatOperationSummaries.GET_MESSAGES })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.MESSAGES_RETRIEVED,
    type: PaginatedMessagesResponseDto,
  })
  async getConversationMessages(
    @CurrentUser() user: JwtUser,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    return await this.chatService.getConversationMessages(
      conversationId,
      user.userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Mark messages as seen in a conversation
   */
  @Patch('conversation/:id/mark-seen')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.MESSAGES_MARKED_AS_SEEN)
  @ApiOperation({ summary: ChatOperationSummaries.MARK_SEEN })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.MESSAGES_MARKED_AS_SEEN,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: ChatResponseMessages.MESSAGES_MARKED_AS_SEEN,
        },
      },
    },
  })
  async markMessagesAsSeen(
    @CurrentUser() user: JwtUser,
    @Param('id') conversationId: string,
  ): Promise<{ message: string }> {
    await this.chatService.markMessagesAsSeen(conversationId, user.userId);
    return { message: 'Messages marked as seen successfully' };
  }

  /**
   * Delete a message (only by sender)
   */
  @Delete('message/:id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.MESSAGE_DELETED)
  @ApiOperation({ summary: ChatOperationSummaries.DELETE_MESSAGE })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.MESSAGE_DELETED,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: ChatResponseMessages.MESSAGE_DELETED,
        },
      },
    },
  })
  async deleteMessage(
    @CurrentUser() user: JwtUser,
    @Param('id') messageId: string,
  ): Promise<{ message: string }> {
    await this.chatService.deleteMessage(messageId, user.userId);
    return { message: 'Message deleted successfully' };
  }

  /**
   * Search messages
   */
  @Get('messages/search')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ChatSuccessMessages.MESSAGES_FOUND)
  @ApiOperation({ summary: ChatOperationSummaries.SEARCH_MESSAGES })
  @ApiResponse({
    status: 200,
    description: ChatSuccessMessages.MESSAGES_FOUND,
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: { $ref: '#/components/schemas/MessageResponseDto' },
        },
      },
    },
  })
  async searchMessages(
    @CurrentUser() user: JwtUser,
    @Query() query: SearchMessagesQueryDto,
  ): Promise<{ messages: MessageResponseDto[] }> {
    if (!query.query) {
      return { messages: [] };
    }

    const messages = await this.chatService.searchMessages(
      user.userId,
      query.query,
      query.conversationId,
    );

    return { messages };
  }
}
