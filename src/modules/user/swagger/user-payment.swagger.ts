import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  UserSuccessMessages,
  UserOperationSummaries,
  ApiResponseDescriptions,
  PaymentSummaryFieldDescriptions,
} from 'src/shared/enums';
import { PaymentStatus } from '../../SSL_Commerce/enums/ssl-commerce.enums';

export function ApiGetUserPaymentSummary() {
  return applyDecorators(
    ApiOperation({ summary: UserOperationSummaries.GET_TOTAL_PAYMENT_AMOUNT }),
    ApiParam({ name: 'id', description: 'User UUID', type: String }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      enum: [PaymentStatus.PENDING, PaymentStatus.SUCCESSFUL],
      description: 'Filter by payment status (optional)',
    }),
    ApiResponse({
      status: 200,
      description: UserSuccessMessages.TOTAL_PAYMENT_AMOUNT_RETRIEVED,
      schema: {
        type: 'object',
        properties: {
          totalEarned: {
            type: 'number',
            example: 15000.0,
            description: PaymentSummaryFieldDescriptions.TOTAL_EARNED,
          },
          availableAmount: {
            type: 'number',
            example: 12000.0,
            description: PaymentSummaryFieldDescriptions.TOTAL_AVAILABLE_FOR_WITHDRAW,
          },
          totalCompleted: {
            type: 'number',
            example: 12000.0,
            description: PaymentSummaryFieldDescriptions.TOTAL_COMPLETED,
          },
          totalPending: {
            type: 'number',
            example: 3000.0,
            description: PaymentSummaryFieldDescriptions.TOTAL_PENDING,
          },
          bookingCount: {
            type: 'number',
            example: 25,
            description: PaymentSummaryFieldDescriptions.BOOKING_COUNT,
          },
          totalHours: {
            type: 'number',
            example: 120,
            description: PaymentSummaryFieldDescriptions.TOTAL_HOURS,
          },
          averageHourlyRate: {
            type: 'number',
            example: 125.0,
            description: PaymentSummaryFieldDescriptions.AVERAGE_HOURLY_RATE,
          },
          monthlyBreakdown: {
            type: 'array',
            description: PaymentSummaryFieldDescriptions.MONTHLY_BREAKDOWN,
            items: {
              type: 'object',
              properties: {
                month: {
                  type: 'string',
                  example: '2026-01',
                  description: PaymentSummaryFieldDescriptions.MONTH,
                },
                totalAmount: {
                  type: 'number',
                  example: 3500.0,
                  description: PaymentSummaryFieldDescriptions.TOTAL_AMOUNT,
                },
                completedAmount: {
                  type: 'number',
                  example: 2500.0,
                  description: PaymentSummaryFieldDescriptions.COMPLETED_AMOUNT,
                },
                pendingAmount: {
                  type: 'number',
                  example: 1000.0,
                  description: PaymentSummaryFieldDescriptions.PENDING_AMOUNT,
                },
                payments: {
                  type: 'array',
                  description: PaymentSummaryFieldDescriptions.DETAILED_PAYMENT_DATA,
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'uuid-123' },
                      amount: { type: 'number', example: 1500.0 },
                      status: {
                        type: 'string',
                        enum: [PaymentStatus.PENDING, PaymentStatus.SUCCESSFUL],
                        example: PaymentStatus.SUCCESSFUL,
                      },
                      transactionId: {
                        type: 'string',
                        example: 'TXN123456789',
                      },
                      bookingId: { type: 'string', example: 'booking-uuid' },
                      paymentDate: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-01-15T10:30:00Z',
                        description: PaymentSummaryFieldDescriptions.PAYMENT_DATE,
                      },
                      serviceType: {
                        type: 'string',
                        example: 'Elderly Care',
                        description: PaymentSummaryFieldDescriptions.SERVICE_TYPE,
                      },
                      duration: {
                        type: 'number',
                        example: 8,
                        description: PaymentSummaryFieldDescriptions.DURATION,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: ApiResponseDescriptions.USER_NOT_FOUND,
    }),
    ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST }),
    ApiUnauthorizedResponse({
      description: ApiResponseDescriptions.UNAUTHORIZED,
    }),
  );
}
