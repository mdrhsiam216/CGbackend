import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Query,
  BadRequestException,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateBookingRequestDto,
  RebookDto,
  ResponseBookingDto,
  BookingListResponseDto,
  ErrorResponseDto,
  SuccessResponseDto,
  BookingPaymentResponseDto,
} from './dtos';
import { BookingsService } from './booking-caregiver.service';
import {
  TimeDuration,
  BookingSuccessMessages,
  BookingOperationSummaries,
  BookingResponseMessages,
  ApiResponseDescriptions,
  BookingApiResponseDescriptions,
} from 'src/shared/enums';
import {
  BookingApiOperation,
  BookingClockAction,
  BookingValidationMessage,
  BookingSuccessMessage,
  BookingApiOperationSummary,
  BookingApiOperationDescription,
  BookingStatus,
} from './enums';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/auth.interface';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingServices: BookingsService) {}

  @Get('my-bookings')
  @ResponseMessage(BookingSuccessMessages.USER_BOOKINGS_RETRIEVED)
  @ApiOperation({ summary: BookingOperationSummaries.GET_USER_BOOKINGS })
  @ApiQuery({ name: 'userId', required: true, description: 'ID of the user' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filter by booking status (comma separated). Default excludes pending bookings and shows: confirmed, in_progress, completed, cancelled',
    type: String,
    example: 'confirmed,completed',
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.USER_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.USER_ID_REQUIRED,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED_ACCESS,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: ApiResponseDescriptions.USER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  async getUserBookings(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    if (!userId) {
      throw new BadRequestException(BookingValidationMessage.USER_ID_REQUIRED);
    }

    let statusArray: BookingStatus[] | undefined;
    const allowedStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ];

    if (status) {
      statusArray = status.split(',').map((s) => s.trim()) as BookingStatus[];
    
      statusArray = statusArray.filter((s) => allowedStatuses.includes(s));

      if (statusArray.length === 0) {
        return { bookings: [], total: 0 };
      }
    } else {
      statusArray = allowedStatuses;
    }

    const response = await this.bookingServices.getUserBookings(
      userId,
      page,
      limit,
      statusArray,
    );
    return response;
  }

  @Post('create')
  @ResponseMessage(BookingSuccessMessages.BOOKING_CREATED)
  @ApiOperation({ summary: BookingOperationSummaries.CREATE })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID of the user creating the booking',
  })
  @ApiBody({ type: CreateBookingRequestDto })
  @ApiCreatedResponse({
    description: BookingSuccessMessages.BOOKING_CREATED,
    type: BookingPaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.INVALID_BOOKING_ID_OR_USER_ID,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED_ACCESS,
    type: ErrorResponseDto,
  })
  async createBooking(
    @Query('userId') userId: string,
    @Body() createBookingDto: CreateBookingRequestDto,
  ) {
    const enhancedDto = {
      ...createBookingDto,
      userId: userId,
    };

    const response = await this.bookingServices.create(enhancedDto);
    return response;
  }

  @Post('/cancel')
  @ResponseMessage(BookingSuccessMessages.BOOKING_CANCELLED)
  @ApiOperation({ summary: BookingOperationSummaries.CANCEL })
  @ApiQuery({
    name: 'bookingId',
    required: true,
    description: 'ID of the booking to cancel',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID of the user requesting cancellation',
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.BOOKING_CANCELLED,
    type: SuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.INVALID_BOOKING_ID_OR_USER_ID,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: BookingApiResponseDescriptions.BOOKING_NOT_FOUND,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: BookingApiResponseDescriptions.USER_NOT_AUTHORIZED_TO_CANCEL,
    type: ErrorResponseDto,
  })
  async cancelBooking(
    @Query('bookingId') bookingId: string,
    @Query('userId') userId: string,
  ) {
    const cancellationPolicy = TimeDuration.WITHIN_2_HOURS;
    const response = await this.bookingServices.cancelbooking(
      bookingId,
      userId,
      cancellationPolicy,
    );
    return response;
  }

  @Get('rebook')
  @ResponseMessage(BookingSuccessMessages.REBOOKING_DETAILS_RETRIEVED)
  @ApiOperation({ summary: BookingOperationSummaries.GET_REBOOK_DETAILS })
  @ApiQuery({
    name: 'bookingId',
    required: true,
    description: 'ID of the previous booking',
  })
  @ApiQuery({ name: 'userId', required: true, description: 'ID of the user' })
  @ApiOkResponse({
    description: BookingSuccessMessages.REBOOKING_DETAILS_RETRIEVED,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: BookingResponseMessages.PREVIOUS_BOOKING_DETAILS_RETRIEVED,
        },
        data: { type: 'object', additionalProperties: true },
      },
    },
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.BOOKING_AND_USER_ID_REQUIRED,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: BookingApiResponseDescriptions.PREVIOUS_BOOKING_NOT_FOUND,
    type: ErrorResponseDto,
  })
  async getRebookDetails(
    @Query('bookingId') bookingId: string,
    @Query('userId') userId: string,
  ) {
    if (!bookingId || !userId) {
      throw new BadRequestException(
        BookingValidationMessage.BOOKING_ID_AND_USER_ID_REQUIRED,
      );
    }
    return this.bookingServices.getPreviousBookingDetails(bookingId, userId);
  }

  @Get('caregiver')
  @ResponseMessage(BookingSuccessMessages.CAREGIVER_BOOKINGS_RETRIEVED)
  @ApiOperation({ summary: BookingOperationSummaries.GET_CAREGIVER_BOOKINGS })
  @ApiQuery({
    name: 'caregiverId',
    required: true,
    description: 'ID of the caregiver',
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.CAREGIVER_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.CAREGIVER_ID_REQUIRED,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: BookingApiResponseDescriptions.CAREGIVER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  async getBookingsByCaregiver(@Query('caregiverId') caregiverId: string) {
    if (!caregiverId) {
      throw new BadRequestException(
        BookingValidationMessage.CAREGIVER_ID_REQUIRED,
      );
    }

    const allowedStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
    ];

    const response = await this.bookingServices.getAllCaregiverBookings(
      caregiverId,
      allowedStatuses,
    );
    return response;
  }

  @Post('rebook')
  @ResponseMessage(BookingSuccessMessages.REBOOKING_SUCCESSFUL)
  @ApiOperation({ summary: BookingOperationSummaries.REBOOK })
  @ApiBody({ type: RebookDto })
  @ApiCreatedResponse({
    description: BookingSuccessMessages.REBOOKING_SUCCESSFUL,
    type: ResponseBookingDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.INVALID_REBOOKING_DATA,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED_ACCESS,
    type: ErrorResponseDto,
  })
  async rebook(@Body() rebookDto: RebookDto) {
    return this.bookingServices.create(rebookDto);
  }

  @Delete()
  @ResponseMessage(BookingSuccessMessages.BOOKING_DELETED)
  @ApiOperation({ summary: BookingOperationSummaries.DELETE })
  @ApiQuery({
    name: 'bookingId',
    required: true,
    description: 'ID of the booking to delete',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID of the user requesting deletion',
  })
  @ApiNoContentResponse({
    description: BookingSuccessMessages.BOOKING_DELETED,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.INVALID_BOOKING_ID_OR_USER_ID,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: BookingApiResponseDescriptions.BOOKING_NOT_FOUND,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: BookingApiResponseDescriptions.USER_NOT_AUTHORIZED_TO_DELETE,
    type: ErrorResponseDto,
  })
  async deleteBooking(
    @Query('bookingId') bookingId: string,
    @Query('userId') userId: string,
  ) {
    return this.bookingServices.deleteBooking(bookingId, userId);
  }

  @Get('admin/all')
  @ResponseMessage(BookingSuccessMessages.ALL_BOOKINGS_RETRIEVED)
  @ApiOperation({ summary: BookingOperationSummaries.GET_ALL_ADMIN })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.ALL_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: BookingApiResponseDescriptions.ADMIN_ACCESS_REQUIRED,
    type: ErrorResponseDto,
  })
  async getAllBookings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.bookingServices.getAllBookings(page, limit);
  }

  @Get('user/caregiverId')
  @ResponseMessage(BookingSuccessMessages.CAREGIVER_BOOKINGS_RETRIEVED)
  @ApiOperation({
    summary: BookingOperationSummaries.GET_CAREGIVER_BOOKINGS_PAGINATED,
  })
  @ApiQuery({
    name: 'caregiverId',
    required: true,
    description: 'ID of the caregiver',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.CAREGIVER_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.CAREGIVER_ID_REQUIRED,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: BookingApiResponseDescriptions.CAREGIVER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  async getBookingsCaregiver(
    @Query('caregiverId') caregiverId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!caregiverId) {
      throw new BadRequestException(
        BookingValidationMessage.CAREGIVER_ID_REQUIRED,
      );
    }
    return this.bookingServices.getCaregiverBookings(caregiverId, page, limit);
  }

  @Get('admin/user')
  @ResponseMessage(BookingSuccessMessages.USER_BOOKINGS_RETRIEVED)
  @ApiOperation({ summary: BookingOperationSummaries.GET_USER_BOOKINGS_ADMIN })
  @ApiQuery({ name: 'userId', required: true, description: 'ID of the user' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: BookingSuccessMessages.USER_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BookingApiResponseDescriptions.USER_ID_REQUIRED,
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: ApiResponseDescriptions.USER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: BookingApiResponseDescriptions.ADMIN_ACCESS_REQUIRED,
    type: ErrorResponseDto,
  })
  async getBookingsByUserId(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!userId) {
      throw new BadRequestException(BookingValidationMessage.USER_ID_REQUIRED);
    }
    return this.bookingServices.getUserBookings(userId, page, limit);
  }

  @Patch(':id/clock-in')
  @ApiOperation({ summary: BookingApiOperation.CAREGIVER_CLOCK_IN })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caregiverId: { type: 'string', example: 'uuid' },
        lat: { type: 'number', example: 23.8103, description: 'Required for distance validation' },
        lng: { type: 'number', example: 90.4125, description: 'Required for distance validation' },
      },
      required: ['caregiverId', 'lat', 'lng'],
    },
  })
  async clockIn(
    @Param('id') bookingId: string,
    @Body('caregiverId') caregiverId: string,
    @Body('lat') lat?: number,
    @Body('lng') lng?: number,
  ) {
    return this.bookingServices.clockIn(bookingId, caregiverId, lat, lng);
  }

  @Patch(':id/request-clock-out')
  @ApiOperation({ summary: BookingApiOperation.CAREGIVER_REQUEST_CLOCK_OUT })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caregiverId: { type: 'string', example: 'uuid' },
        lat: { type: 'number', example: 23.8103, description: 'Required for distance validation' },
        lng: { type: 'number', example: 90.4125, description: 'Required for distance validation' },
      },
      required: ['caregiverId', 'lat', 'lng'],
    },
  })
  async requestClockOut(
    @Param('id') bookingId: string,
    @Body('caregiverId') caregiverId: string,
    @Body('lat') lat?: number,
    @Body('lng') lng?: number,
  ) {
    return this.bookingServices.requestClockOut(bookingId, caregiverId, lat, lng);
  }

  @Patch(':id/respond-clock-out')
  @ApiOperation({
    summary: BookingApiOperation.CLIENT_RESPOND_TO_CLOCK_OUT_REQUEST,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid' },
        action: {
          type: 'string',
          enum: [BookingClockAction.ACCEPT, BookingClockAction.DECLINE],
          example: BookingClockAction.ACCEPT,
        },
      },
    },
  })
  async respondClockOut(
    @Param('id') bookingId: string,
    @Body('userId') userId: string,
    @Body('action') action: 'accept' | 'decline',
  ) {
    return this.bookingServices.respondClockOut(bookingId, userId, action);
  }

  @Post('payment/success')
  async paymentSuccess(@Body() body: any) {
    return this.bookingServices.handlePaymentSuccess(
      body.tran_id,
      body.val_id || body.tran_id,
    );
  }

  @Post('payment/fail')
  async paymentFail(@Body() body: any) {
    return this.bookingServices.handlePaymentFail(body.tran_id);
  }

  @Post('payment/cancel')
  async paymentCancel(@Body() body: any) {
    return this.bookingServices.handlePaymentCancel(body.tran_id);
  }

  @Get('active-clocked-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage(BookingSuccessMessage.ACTIVE_CLOCKED_IN_BOOKINGS_RETRIEVED)
  @ApiOperation({
    summary: BookingApiOperationSummary.GET_USER_ACTIVE_CLOCKED_IN_BOOKINGS,
    description: BookingApiOperationDescription.GET_ACTIVE_CLOCKED_IN_BOOKINGS,
  })
  @ApiOkResponse({
    description: BookingSuccessMessage.ACTIVE_CLOCKED_IN_BOOKINGS_RETRIEVED,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        count: { type: 'number', example: 5 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED_ACCESS,
    type: ErrorResponseDto,
  })
  @ApiQuery({
    name: 'bookingId',
    required: false,
    description: 'Optional booking ID to filter the active clocked-in booking',
    type: String,
  })
  async getActiveClockedInBookings(
    @CurrentUser() user: JwtUser,
    @Query('bookingId') bookingId?: string,
  ) {
    return this.bookingServices.getActiveClockedInBookings(user, bookingId);
  }
}
