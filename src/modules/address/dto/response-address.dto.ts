import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AddressResponseDto {
  @ApiProperty({
    description: 'Address ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main St',
  })
  @Expose()
  streetAddress?: string;

  @ApiPropertyOptional({
    description: 'Apartment or unit number',
    example: 'Apt 4B',
  })
  @Expose()
  apartment?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @Expose()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province', example: 'NY' })
  @Expose()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @Expose()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @Expose()
  country?: string;

  @ApiPropertyOptional({
    description: 'Full address string',
    example: '123 Main St, Apt 4B, New York, NY 10001',
  })
  @Expose()
  address?: string;

  @ApiPropertyOptional({
    description: 'Address type',
    example: 'residential',
    enum: ['residential', 'business', 'home', 'office', 'other'],
  })
  @Expose()
  addressType?: string;

  @ApiPropertyOptional({
    description: 'Coordinates',
    example: { lat: 40.7128, lng: -74.006 },
  })
  @Expose()
  coordinates?: { lat: number; lng: number };

  @ApiProperty({ description: 'Is default address', example: false })
  @Expose()
  isDefault: boolean;

  @ApiPropertyOptional({ description: 'Address label', example: 'Home' })
  @Expose()
  label?: string;

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
