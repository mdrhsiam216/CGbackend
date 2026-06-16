import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class CaregiverBasicDto {
  @ApiProperty({
    description: 'Caregiver ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Caregiver first name', example: 'John' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Caregiver last name', example: 'Doe' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'Is caregiver verified', example: true })
  @Expose()
  verified: boolean;
}

export class ResponseAvailabilitySlotDto {
  @ApiProperty({
    description: 'Availability Slot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Caregiver ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  caregiverId: string;

  @ApiPropertyOptional({
    description: 'Caregiver details',
    type: CaregiverBasicDto,
  })
  @Expose()
  @Type(() => CaregiverBasicDto)
  caregiver?: CaregiverBasicDto;

  @ApiProperty({
    description: 'Days of the week (0-6)',
    isArray: true,
    example: [1, 3, 5],
  })
  @Expose()
  daysOfWeek: number[];

  @ApiPropertyOptional({
    description: 'Time slots',
    isArray: true,
    example: ['MORNING'],
  })
  @Expose()
  timeSlots: string[] | null;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  @Expose()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '17:00' })
  @Expose()
  endTime: string;

  @ApiProperty({ description: 'Schedule may vary', example: false })
  @Expose()
  scheduleMayVary: boolean;

  @ApiPropertyOptional({ description: 'Expected minimum rate', example: 20 })
  @Expose()
  expectedMinRate: number | null;

  @ApiPropertyOptional({ description: 'Expected maximum rate', example: 30 })
  @Expose()
  expectedMaxRate: number | null;

  @ApiProperty({ description: 'Is active', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
