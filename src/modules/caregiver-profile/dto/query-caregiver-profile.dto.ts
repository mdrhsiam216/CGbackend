import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SortOption {
  RECOMMENDED = 'recommended',
  HIGHLY_RATED = 'highly_rated',
  PRICE_LOW_TO_HIGH = 'price_low_to_high',
  PRICE_HIGH_TO_LOW = 'price_high_to_low',
  MOST_EXPERIENCED = 'most_experienced',
}

export class QueryCaregiverProfileDto {
  @ApiPropertyOptional({
    description: 'Search term for name or bio',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specializations (comma-separated)',
    example: "Alzheimer's Care,Dementia Care",
    type: String,
  })
  @IsOptional()
  specializations?: string[];

  @ApiPropertyOptional({
    description: 'Filter by base price per hour (less than or equal to)',
    example: 50,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by availability now',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  availableNow?: boolean;

  @ApiPropertyOptional({
    description: 'Sort option',
    enum: SortOption,
    example: SortOption.RECOMMENDED,
  })
  @IsOptional()
  @IsEnum(SortOption)
  sortBy?: SortOption;

  @ApiPropertyOptional({ description: 'Filter by service area', type: String })
  @IsOptional()
  @IsString()
  serviceArea?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
