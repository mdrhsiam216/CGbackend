import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryCaregiverProfileDto } from './query-caregiver-profile.dto';

export class QueryNearbyCaregiverProfileDto extends QueryCaregiverProfileDto {
  @ApiProperty({
    description: 'Latitude',
    example: 40.7128,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitude',
    example: -74.006,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({
    description: 'Radius in km',
    example: 10,
    default: 10,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;
}
