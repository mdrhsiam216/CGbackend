import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmergencyContactsDto } from '../../bookings/dtos/emergency-contact.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from 'src/shared/enums';
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'User password (min 8 characters, must contain uppercase, lowercase, and number/special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, and number/special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name (letters only)',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'First name must contain only letters',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name (letters only)',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Last name must contain only letters',
  })
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    {
      message: 'Invalid phone number format',
    },
  )
  phone: string;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'Role ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  emergencyContacts?: EmergencyContactsDto;
}
