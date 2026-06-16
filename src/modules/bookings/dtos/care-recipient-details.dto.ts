import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CareRecipientDetailsDto {
  @ApiPropertyOptional({
    description: 'Who needs care (e.g., Me, Child, Elder)',
    example: 'Me',
  })
  @Expose()
  @IsOptional()
  @IsString()
  whoNeedsCare?: string;

  @ApiPropertyOptional({
    description: 'Gender of the care recipient',
    example: 'Male',
  })
  @Expose()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Age group of the care recipient',
    example: '50s',
  })
  @Expose()
  @IsOptional()
  @IsString()
  ageGroup?: string;
}
