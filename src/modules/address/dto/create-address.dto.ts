import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CoordinatesDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -74.006 })
  @IsNumber()
  lng: number;
}

export class SetDefaultAddressDto {
  @ApiProperty({
    description: 'Address ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  addressId: string;
}

export class CreateAddressDto {
  @ApiProperty({ description: 'Street address', example: '123 Main St' })
  @IsString()
  streetAddress: string;

  @ApiPropertyOptional({
    description: 'Apartment or unit number',
    example: 'Apt 4B',
  })
  @IsString()
  @IsOptional()
  apartment?: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State or province', example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'Postal code', example: '10001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ description: 'Country', example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Full address string',
    example: '123 Main St, Apt 4B, New York, NY 10001',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Address type',
    example: 'residential',
    enum: ['residential', 'business', 'home', 'office', 'other'],
  })
  @IsString()
  @IsOptional()
  addressType?: string;

  @ApiPropertyOptional({ description: 'Coordinates', type: CoordinatesDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({ description: 'Is default address', example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Address label', example: 'Home' })
  @IsString()
  @IsOptional()
  label?: string;
}
