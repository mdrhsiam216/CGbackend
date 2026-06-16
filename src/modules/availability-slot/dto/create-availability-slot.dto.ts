import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { DayOfWeek, TimeSlot } from '../entities/availability-slot.entity';

export class CreateAvailabilitySlotDto {
  @ApiProperty({
    description: 'Days of the week (0-6, where 0 is Sunday)',
    enum: DayOfWeek,
    isArray: true,
    example: [1, 3, 5],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one day must be selected' })
  @IsEnum(DayOfWeek, { each: true })
  @Type(() => Number)
  daysOfWeek: number[];

  @ApiPropertyOptional({
    description: 'Time slots (e.g., MORNING, AFTERNOON)',
    enum: TimeSlot,
    isArray: true,
    example: ['MORNING', 'AFTERNOON'],
  })
  @IsArray()
  @IsEnum(TimeSlot, { each: true })
  @IsOptional()
  timeSlots?: string[];

  @ApiProperty({
    description: 'Start times in HH:MM format',
    isArray: true,
    example: ['09:00', '14:00'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one start time is required' })
  @IsString({ each: true })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    each: true,
    message: 'Each start time must be in HH:MM format',
  })
  startTime: string[];

  @ApiProperty({
    description: 'End times in HH:MM format',
    isArray: true,
    example: ['12:00', '17:00'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one end time is required' })
  @IsString({ each: true })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    each: true,
    message: 'Each end time must be in HH:MM format',
  })
  endTime: string[];

  @ApiPropertyOptional({
    description: 'Indicates if the schedule may vary',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  scheduleMayVary?: boolean;

  @ApiPropertyOptional({
    description: 'Expected minimum hourly rate',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMinRate?: number;

  @ApiPropertyOptional({
    description: 'Expected maximum hourly rate',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMaxRate?: number;
}
