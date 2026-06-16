import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoordinatesDto } from './create-address.dto';

export class UpdateAddressDto {
  @ApiPropertyOptional({
    description: 'Address ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ description: 'Street address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @ApiPropertyOptional({
    description: 'Apartment or unit number',
    example: 'Apt 4B',
  })
  @IsString()
  @IsOptional()
  apartment?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province', example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
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
