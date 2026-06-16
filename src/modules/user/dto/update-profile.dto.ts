import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User first name (letters only)',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'First name must contain only letters',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name (letters only)',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Last name must contain only letters',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  @Matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    {
      message: 'Invalid phone number format',
    },
  )
  phone?: string;
}
