import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../SSL_Commerce/enums/ssl-commerce.enums';

export class PaymentDetailDto {
  @ApiProperty({ example: 'uuid-123', description: 'Payment ID' })
  id: string;

  @ApiProperty({ example: 1500.0, description: 'Payment amount' })
  amount: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESSFUL,
    description: 'Payment status',
  })
  status: PaymentStatus;

  @ApiProperty({
    example: 'TXN123456789',
    description: 'Transaction ID',
  })
  transactionId: string;

  @ApiProperty({
    example: 'booking-uuid-123',
    description: 'Booking ID',
  })
  bookingId: string;

  @ApiProperty({
    example: '2026-01-15T10:30:00Z',
    description: 'Payment date',
  })
  paymentDate: Date;

  @ApiProperty({
    example: 'Elderly Care',
    description: 'Service type',
  })
  serviceType: string;

  @ApiProperty({
    example: 8,
    description: 'Duration in hours',
  })
  duration: number;
}

export class MonthlyBreakdownDto {
  @ApiProperty({ example: '2026-01', description: 'Month in YYYY-MM format' })
  month: string;

  @ApiProperty({
    example: 3500.0,
    description: 'Total amount for the month (completed + pending)',
  })
  totalAmount: number;

  @ApiProperty({
    example: 2500.0,
    description: 'Completed payment amount for the month',
  })
  completedAmount: number;

  @ApiProperty({
    example: 1000.0,
    description: 'Pending payment amount for the month',
  })
  pendingAmount: number;

  @ApiProperty({
    type: [PaymentDetailDto],
    description: 'Detailed payment data for the month',
  })
  payments: PaymentDetailDto[];
}

export class UserPaymentSummaryDto {
  @ApiProperty({
    example: 15000.0,
    description: 'Total earned (completed + pending)',
  })
  totalEarned: number;

  @ApiProperty({
    example: 12000.0,
    description: 'Available amount (sum of successful payments)',
  })
  availableAmount: number;

  @ApiProperty({
    example: 12000.0,
    description: 'Total completed payments',
  })
  totalCompleted: number;

  @ApiProperty({
    example: 3000.0,
    description: 'Total pending payments',
  })
  totalPending: number;

  @ApiProperty({
    example: 25,
    description: 'Number of bookings',
  })
  bookingCount: number;

  @ApiProperty({
    example: 120,
    description: 'Total hours worked',
  })
  totalHours: number;

  @ApiProperty({
    example: 125.0,
    description: 'Average hourly rate',
  })
  averageHourlyRate: number;

  @ApiProperty({
    type: [MonthlyBreakdownDto],
    description: 'Monthly breakdown of payments (sorted by date DESC)',
  })
  monthlyBreakdown: MonthlyBreakdownDto[];
}
