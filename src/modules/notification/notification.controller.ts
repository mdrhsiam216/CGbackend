import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { NotificationService } from './notification.service';
import {
  RegisterDeviceDto,
  SendNotificationToUserDto,
  SendNotificationToMultipleDto,
  SendNotificationToTopicDto,
  TopicSubscriptionDto,
} from './dto';

interface JwtUser {
  userId: string;
  email: string;
  roles: string[];
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Register a device for push notifications
   * POST /notifications/register-device
   */
  @Post('register-device')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Device registered successfully')
  async registerDevice(
    @CurrentUser() user: JwtUser,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationService.registerDevice(
      user.userId,
      registerDeviceDto,
    );
  }

  /**
   * Unregister a device from push notifications
   * DELETE /notifications/unregister-device
   */
  @Delete('unregister-device')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Device unregistered successfully')
  async unregisterDevice(
    @CurrentUser() user: JwtUser,
    @Query('deviceToken') deviceToken: string,
  ) {
    await this.notificationService.unregisterDevice(user.userId, deviceToken);
    return { success: true };
  }

  /**
   * Get all registered devices for the current user
   * GET /notifications/devices
   */
  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Devices retrieved successfully')
  async getUserDevices(@CurrentUser() user: JwtUser) {
    return this.notificationService.getUserDevices(user.userId);
  }

  /**
   * Send notification to a single user
   * POST /notifications/send-to-user
   */
  @Post('send-to-user')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Notification sent')
  async sendToUser(@Body() dto: SendNotificationToUserDto) {
    return this.notificationService.sendToUser(dto);
  }

  /**
   * Send notification to multiple users
   * POST /notifications/send-multiple
   */
  @Post('send-multiple')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Notification sent to multiple users')
  async sendToMultiple(@Body() dto: SendNotificationToMultipleDto) {
    return this.notificationService.sendToMultiple(dto);
  }

  /**
   * Send notification to a topic
   * POST /notifications/send-topic
   */
  @Post('send-topic')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Topic notification sent')
  async sendToTopic(@Body() dto: SendNotificationToTopicDto) {
    return this.notificationService.sendToTopic(dto);
  }

  /**
   * Subscribe current user to a topic
   * POST /notifications/subscribe-topic
   */
  @Post('subscribe-topic')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Subscribed to topic')
  async subscribeToTopic(
    @CurrentUser() user: JwtUser,
    @Body() dto: TopicSubscriptionDto,
  ) {
    return this.notificationService.subscribeToTopic(user.userId, dto);
  }

  /**
   * Unsubscribe current user from a topic
   * POST /notifications/unsubscribe-topic
   */
  @Post('unsubscribe-topic')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Unsubscribed from topic')
  async unsubscribeFromTopic(
    @CurrentUser() user: JwtUser,
    @Body() dto: TopicSubscriptionDto,
  ) {
    return this.notificationService.unsubscribeFromTopic(user.userId, dto);
  }

  /**
   * Get notification history for the current user
   * GET /notifications/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notification history retrieved')
  async getNotificationHistory(
    @CurrentUser() user: JwtUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getUserNotificationHistory(user.userId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  /**
   * Check Firebase configuration status
   * GET /notifications/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notification service status')
  async getStatus() {
    return {
      firebaseConfigured: this.notificationService.isFirebaseConfigured(),
    };
  }
}
