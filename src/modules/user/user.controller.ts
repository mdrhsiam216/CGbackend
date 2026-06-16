import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFile as NestUploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  UserSuccessMessages,
  UserStatus,
  UserOperationSummaries,
  ApiResponseDescriptions,
  UserApiResponseDescriptions,
} from 'src/shared/enums';
import { PaymentStatus } from '../SSL_Commerce/enums/ssl-commerce.enums';
import { QueryUserDto } from './dto/query-user-dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UploadedFile } from '../../shared/aws/interfaces/s3.interface';
import { UserService } from './user.service';
import { ApiGetUserPaymentSummary } from './swagger/user-payment.swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Registration moved to auth module (/auth/register)

  @Get()
  @ResponseMessage(UserSuccessMessages.USERS_RETRIEVED)
  @ApiOperation({ summary: UserOperationSummaries.GET_ALL })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering users',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'Filter by user status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    description: 'Filter by role ID',
  })
  @ApiResponse({
    status: 200,
    description: UserSuccessMessages.USERS_RETRIEVED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  findAllUsers(@Query() queryUserDto: QueryUserDto) {
    return this.userService.findAllUsers(queryUserDto);
  }

  @Get(':id')
  @ResponseMessage(UserSuccessMessages.USER_RETRIEVED)
  @ApiOperation({ summary: UserOperationSummaries.GET_BY_ID })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 200, description: UserSuccessMessages.USER_RETRIEVED })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  findOneUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOneUser(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(UserSuccessMessages.USER_UPDATED)
  @ApiOperation({ summary: UserOperationSummaries.UPDATE })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: UserSuccessMessages.USER_UPDATED })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: UserApiResponseDescriptions.INVALID_USER_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(UserSuccessMessages.PASSWORD_UPDATED)
  @ApiOperation({ summary: UserOperationSummaries.UPDATE_PASSWORD })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({
    status: 200,
    description: UserSuccessMessages.PASSWORD_UPDATED,
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: UserApiResponseDescriptions.INVALID_PASSWORD,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  updateUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updateUserPassword(id, updatePasswordDto);
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ResponseMessage(UserSuccessMessages.USER_UPDATED)
  @ApiOperation({ summary: UserOperationSummaries.UPDATE_PROFILE })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'User first name',
          example: 'John',
        },
        lastName: {
          type: 'string',
          description: 'User last name',
          example: 'Doe',
        },
        phone: {
          type: 'string',
          description: 'User phone number',
          example: '+1234567890',
        },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: UserSuccessMessages.USER_UPDATED })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: UserApiResponseDescriptions.INVALID_USER_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @NestUploadedFile() avatar?: UploadedFile,
  ) {
    return this.userService.updateProfile(id, updateProfileDto, avatar);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(UserSuccessMessages.USER_STATUS_UPDATED)
  @ApiOperation({ summary: UserOperationSummaries.UPDATE_STATUS })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(UserStatus),
          description: 'New user status',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: UserSuccessMessages.USER_STATUS_UPDATED,
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: UserApiResponseDescriptions.INVALID_STATUS,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.userService.updateUserStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(UserSuccessMessages.USER_DELETED)
  @ApiOperation({ summary: UserOperationSummaries.DELETE })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 200, description: UserSuccessMessages.USER_DELETED })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  removeUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.removeUser(id);
  }

  @Get(':id/total-payment')
  @ResponseMessage(UserSuccessMessages.TOTAL_PAYMENT_AMOUNT_RETRIEVED)
  @ApiGetUserPaymentSummary()
  getUserPaymentSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ) {
    return this.userService.getUserPaymentSummary(id, paymentStatus);
  }
}
