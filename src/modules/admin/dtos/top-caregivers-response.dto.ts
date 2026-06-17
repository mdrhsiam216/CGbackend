import { ApiProperty } from '@nestjs/swagger';
import { TopCaregiverDto } from './top-caregiver.dto';
import { PaginationDto } from './pagination.dto';

export class TopCaregiversResponseDto {
  @ApiProperty({
    type: [TopCaregiverDto],
    description: 'List of top performing caregivers',
  })
  caregivers: TopCaregiverDto[];

  @ApiProperty({
    type: PaginationDto,
    description: 'Pagination information',
  })
  pagination: PaginationDto;
}