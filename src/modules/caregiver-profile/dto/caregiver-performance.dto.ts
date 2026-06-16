import { ApiProperty } from '@nestjs/swagger';

export class CaregiverMonthlyPerformanceDto {
  @ApiProperty({
    description: 'Number of services completed in the current month',
    example: 28,
  })
  servicesCompleted: number;

  @ApiProperty({
    description: 'Total hours worked in the current month',
    example: 156,
  })
  totalHours: number;

  @ApiProperty({
    description: 'Acceptance rate for the current month (percentage 0-100)',
    example: 92,
  })
  acceptanceRate: number;

  @ApiProperty({
    description: 'Average client rating for the caregiver (1-5 scale)',
    example: 4.8,
  })
  clientSatisfaction: number;
}
