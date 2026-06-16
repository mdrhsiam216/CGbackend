import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddressDto } from '../../address/dto/update-address.dto';

class EmergencyContactDto {
  @ApiPropertyOptional({ example: 'John Wick' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Friend' })
  @IsString()
  @IsOptional()
  relationship?: string;
}

class EmergencyContactsDto {
  @ApiPropertyOptional({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  primary?: EmergencyContactDto;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  secondary?: EmergencyContactDto;
}

export class UpdateClientProfileDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the client',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the client',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Male',
    description: 'Gender of the client',
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number of the client',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL of the client',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '1999-01-01',
    description: 'Date of birth (ISO 8601 format)',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    type: EmergencyContactsDto,
    description: 'Emergency contact information',
  })
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  @IsOptional()
  emergencyContacts?: EmergencyContactsDto;

  @ApiPropertyOptional({
    type: UpdateAddressDto,
    description: 'Address information',
  })
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;
}
