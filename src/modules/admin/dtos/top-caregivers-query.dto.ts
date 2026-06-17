import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TopCaregiversQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number = 4.0;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minReviews?: number = 1;

  @ApiPropertyOptional({ example: 'rating', enum: ['rating', 'reviews', 'bookings'] })
  @IsOptional()
  @IsIn(['rating', 'reviews', 'bookings'])
  sortBy?: 'rating' | 'reviews' | 'bookings' = 'rating';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
