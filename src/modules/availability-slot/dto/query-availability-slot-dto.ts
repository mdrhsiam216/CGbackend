import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { DayOfWeek, TimeSlot } from '../entities/availability-slot.entity';

export class QueryAvailabilitySlotDto {
  @ApiPropertyOptional({ description: 'Filter by Caregiver ID' })
  @IsOptional()
  @IsUUID()
  caregiverId?: string;

  @ApiPropertyOptional({
    description: 'Filter by days of week',
    enum: DayOfWeek,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @Type(() => Number)
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    description: 'Filter by time slots',
    enum: TimeSlot,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TimeSlot, { each: true })
  timeSlots?: string[];

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by schedule may vary' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  scheduleMayVary?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
