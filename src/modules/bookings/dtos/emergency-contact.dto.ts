import {
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Name of the emergency contact',
    example: 'John Doe',
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Phone number of the emergency contact',
    example: '+1234567890',
  })
  @Expose()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Relationship with the user',
    example: 'Father',
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  relationship: string;
}

export class EmergencyContactsDto {
  @ApiProperty({
    description: 'Primary emergency contact',
    type: EmergencyContactDto,
  })
  @Expose()
  @IsNotEmpty()
  primary: EmergencyContactDto;

  @ApiPropertyOptional({
    description: 'Secondary emergency contact',
    type: EmergencyContactDto,
  })
  @Expose()
  @IsOptional()
  secondary?: EmergencyContactDto;
}
