import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCaregiverProfileDto, CreateCertificateNestedDto } from './create-caregiver-profile.dto';
import { UpdateAddressDto } from '../../address/dto/update-address.dto';
import { Type } from 'class-transformer';
import { CaregiverProfileApiDescriptions } from '../../../shared/enums/caregiver-profile.enums';
import { IsArray } from 'class-validator';

export class UpdateCertificateNestedDto extends PartialType(CreateCertificateNestedDto) {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  caregiverProfileId?: string;
}

export class UpdateCaregiverProfileDto extends PartialType(
  OmitType(CreateCaregiverProfileDto, ['userId', 'address', 'certificates'] as const),
) {
  @ApiPropertyOptional({
    type: UpdateAddressDto,
    description: CaregiverProfileApiDescriptions.UPDATE_ADDRESS,
  })
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;

  @ApiPropertyOptional({
    type: [UpdateCertificateNestedDto],
    description: 'List of certificates to update or add',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCertificateNestedDto)
  @IsOptional()
  certificates?: UpdateCertificateNestedDto[];
}
