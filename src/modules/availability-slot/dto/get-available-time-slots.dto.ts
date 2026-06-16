import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class GetAvailableTimeSlotsDto {
  // Date for the booking (YYYY-MM-DD format)
  @ApiProperty({
    description: 'Date for the booking (YYYY-MM-DD)',
    example: '2023-12-25',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  // Duration in hours
  @ApiProperty({ description: 'Duration in hours', example: 2, minimum: 1 })
  @IsInt()
  @Min(1, { message: 'Duration must be at least 1 hour' })
  @Type(() => Number)
  durationHours: number;
}
