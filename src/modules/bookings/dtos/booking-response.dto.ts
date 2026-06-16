import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyContactsDto } from './emergency-contact.dto';
import { AddressResponseDto } from '../../address/dto/response-address.dto';
import { CareRecipientDetailsDto } from './care-recipient-details.dto';

export class BookingDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Service type', example: 'Elderly Care' })
  @Expose()
  serviceType: string;

  @ApiProperty({ description: 'Date of booking', example: '2023-12-25' })
  @Expose()
  date: string;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  @Expose()
  startTime: string;

  @ApiProperty({ description: 'Duration in hours', example: 4 })
  @Expose()
  duration: number;

  @ApiPropertyOptional({
    type: AddressResponseDto,
    description: 'Address information for the booking',
  })
  @Expose()
  @Type(() => AddressResponseDto)
  address?: AddressResponseDto;

  @ApiProperty({ description: 'Contact email', example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    description: 'Special instructions',
    example: 'Bring lunch',
  })
  @Expose()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Array of dates of birth for care recipients',
    example: ['1950-05-15'],
  })
  @Expose()
  careRecipientDateOfBirth?: string[];

  @ApiPropertyOptional({
    description: 'Care recipient details',
    type: CareRecipientDetailsDto,
  })
  @Expose()
  @Type(() => CareRecipientDetailsDto)
  careRecipientDetails?: CareRecipientDetailsDto;

  @ApiProperty({ description: 'Booking status', example: 'pending' })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Caregiver ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  caregiverId: string;

  @ApiProperty({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @Expose()
  @Type(() => EmergencyContactsDto)
  emergencyContacts: EmergencyContactsDto;

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}

export class ResponseBookingDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  @Expose()
  success: boolean = true;

  @ApiProperty({
    description: 'Message describing the result of the operation',
    example: 'Booking created successfully',
  })
  @Expose()
  message: string = 'Booking created successfully';

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2023-10-27T10:00:00.000Z',
  })
  @Expose()
  @Transform(({ value }) => value || new Date().toISOString())
  timestamp: string;

  @ApiProperty({
    description: 'Path of the request',
    example: '/bookings',
  })
  @Expose()
  path: string = '/bookings';

  @ApiProperty({
    description: 'HTTP status code',
    example: 201,
  })
  @Expose()
  statusCode: number = 201;
}

export class BookingPaymentResponseDto {
  @ApiProperty({ type: BookingDto })
  booking: BookingDto;

  @ApiProperty({ description: 'Payment Gateway URL' })
  paymentUrl: string;
}
