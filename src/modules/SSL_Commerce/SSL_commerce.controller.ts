import { Body, Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { SSLCommerceService } from './SSL_commerce.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import {
  TransactionStatusMessage,
  ApiResponseDescriptions,
} from '../../shared/enums/messages.enums';
import {
  ApiOperationSummary,
  ApiResponseDescription,
  SwaggerExample,
  PaymentMessage,
} from './enums';

@ApiTags('Payment (SSL Commerce)')
@Controller('ssl-commerce')
export class SSLCommerceController {
  constructor(private readonly sslCommerceService: SSLCommerceService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('init-booking-payment')
  @ApiOperation({ summary: ApiOperationSummary.INIT_BOOKING_PAYMENT })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.PAYMENT_INITIALIZED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', example: SwaggerExample.BOOKING_UUID },
      },
    },
  })
  async initBookingPayment(
    @Body() body: { bookingId: string },
    @CurrentUser() user: User,
  ) {
    return this.sslCommerceService.initiateBookingPayment(body.bookingId, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/completed-bookings')
  @ApiOperation({ summary: ApiOperationSummary.GET_COMPLETED_BOOKINGS })
  @ApiResponse({
    status: 200,
    description: `Returns bookings with status ${TransactionStatusMessage.COMPLETED}`,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  async getCompletedBookings() {
    return this.sslCommerceService.getCompletedBookingsForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('admin/pay-caregiver')
  @ApiOperation({ summary: ApiOperationSummary.PAY_CAREGIVER })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.CAREGIVER_PAID,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', example: SwaggerExample.BOOKING_UUID },
        transactionId: {
          type: 'string',
          example: SwaggerExample.TRANSACTION_ID,
        },
      },
    },
  })
  async payCaregiver(
    @Body() body: { bookingId: string; transactionId: string },
  ) {
    return this.sslCommerceService.payCaregiver(
      body.bookingId,
      body.transactionId,
    );
  }

  @Post('success')
  @ApiOperation({ summary: ApiOperationSummary.PAYMENT_SUCCESS_CALLBACK })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.PAYMENT_SUCCESS_PROCESSED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiQuery({ name: 'tran_id', required: false, type: String })
  async paymentSuccess(
    @Body() body: any,
    @Query('tran_id') queryTranId: string,
  ) {
    const tranId = body.tran_id || queryTranId;
    return this.sslCommerceService.handlePaymentSuccess(tranId);
  }

  @Post('fail')
  @ApiOperation({ summary: ApiOperationSummary.PAYMENT_FAIL_CALLBACK })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.PAYMENT_FAILURE_PROCESSED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiQuery({ name: 'tran_id', required: false, type: String })
  async paymentFail(@Body() body: any, @Query('tran_id') queryTranId: string) {
    return {
      message: PaymentMessage.PAYMENT_FAILED,
      tranId: body.tran_id || queryTranId,
    };
  }

  @Post('cancel')
  @ApiOperation({ summary: ApiOperationSummary.PAYMENT_CANCEL_CALLBACK })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.PAYMENT_CANCELLATION_PROCESSED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiQuery({ name: 'tran_id', required: false, type: String })
  async paymentCancel(
    @Body() body: any,
    @Query('tran_id') queryTranId: string,
  ) {
    return {
      message: PaymentMessage.PAYMENT_CANCELLED,
      tranId: body.tran_id || queryTranId,
    };
  }

  @Post('validate-payment')
  @ApiOperation({ summary: ApiOperationSummary.VALIDATE_PAYMENT })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.PAYMENT_VALIDATED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        valId: { type: 'string', example: SwaggerExample.VALIDATION_ID },
      },
    },
  })
  async validatePayment(@Body() body: { valId: string }) {
    return this.sslCommerceService.validatePayment(body.valId);
  }

  @Post('transaction-query')
  @ApiOperation({ summary: ApiOperationSummary.QUERY_TRANSACTION_STATUS })
  @ApiResponse({
    status: 201,
    description: ApiResponseDescription.TRANSACTION_STATUS_RETRIEVED,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tranId: {
          type: 'string',
          example: SwaggerExample.TRANSACTION_ID_EXAMPLE,
        },
      },
    },
  })
  async transactionQuery(@Body() body: { tranId: string }) {
    return this.sslCommerceService.transactionQuery(body.tranId);
  }
}
