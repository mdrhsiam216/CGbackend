import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class ReviewerDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;
}

class ServiceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Elderly Care', description: 'Type of service provided' })
  @Expose()
  serviceType: string;

  @ApiProperty({ example: '2024-01-15', description: 'Service date' })
  @Expose()
  date: string;

  @ApiProperty({ example: '09:00', description: 'Service start time' })
  @Expose()
  startTime: string;

  @ApiProperty({ example: 4, description: 'Service duration in hours' })
  @Expose()
  duration: number;
}

export class ResponseReviewDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Booking ID this review is for. Present for service-based reviews.',
  })
  @Expose()
  bookingId?: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  caregiverProfileId: string;

  @ApiPropertyOptional({
    type: ServiceDto,
    description: 'Service (booking) details for which this review was given',
  })
  @Expose()
  @Type(() => ServiceDto)
  service?: ServiceDto;

  @ApiProperty({
    type: ReviewerDto,
    description: 'Client who gave this review for the service',
  })
  @Expose()
  reviewer: ReviewerDto;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Expose()
  rating: number;

  @ApiProperty({
    example: 'Excellent caregiver, very professional and caring.',
    required: false,
  })
  @Expose()
  comment: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  updatedAt: Date;
}
