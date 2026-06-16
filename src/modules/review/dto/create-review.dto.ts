import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description:
      'Booking ID of the completed service. Review can only be submitted after clock out is approved (booking status = completed).',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Booking ID is required' })
  @IsUUID('4', { message: 'Booking ID must be a valid UUID' })
  bookingId: string;

  @ApiProperty({
    description: 'Rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty({ message: 'Rating is required' })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent caregiver, very professional and caring.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment?: string;
}
