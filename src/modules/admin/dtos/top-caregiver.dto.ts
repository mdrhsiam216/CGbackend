import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class TopCaregiverDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: 'URL to caregiver profile picture',
  })
  @Expose()
  profilePictureUrl?: string;

  @ApiProperty({ example: 4.8, description: 'Average rating (0-5)' })
  @Expose()
  averageRating: number;

  @ApiProperty({ example: 45, description: 'Total number of reviews' })
  @Expose()
  totalReviews: number;

  @ApiProperty({ example: 50, description: 'Total number of bookings' })
  @Expose()
  totalBookings: number;

  @ApiProperty({ example: 500, description: 'Base hourly rate in BDT' })
  @Expose()
  baseHourlyRate: number;

  @ApiProperty({
    example: ['Elderly Care', 'Child Care'],
    description: 'Caregiver specializations',
  })
  @Expose()
  specializations: string[];

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience',
  })
  @Expose()
  yearsOfExperience?: number;

  @ApiProperty({ example: true, description: 'Whether caregiver is verified' })
  @Expose()
  verified: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  @Expose()
  createdAt: Date;
}