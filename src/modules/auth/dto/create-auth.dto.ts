import {
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoginCredentials } from '../interfaces/auth.interface';
import { AddressResponseDto } from '../../address/dto/response-address.dto';

export class LoginDto implements LoginCredentials {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: 'Either email or phone is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (alternative to email)',
    example: '+1234567890',
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Either email or phone is required' })
  @IsString()
  @Matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    {
      message: 'Phone must be a valid phone number',
    },
  )
  phone?: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description:
      "Role ID to login as (must match one of user's assigned roles)",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Role ID is required for login' })
  @IsString()
  roleId: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiProperty({
    description: 'User roles',
    type: [String],
    example: ['client', 'caregiver'],
  })
  roles: string[];

  @ApiProperty({
    description: 'Response message',
    example: 'Login successful',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Caregiver profile data (if user is a caregiver)',
  })
  caregiverProfile?: any;

  @ApiPropertyOptional({
    description: 'Client profile data (if user is a client)',
  })
  clientProfile?: any;

  @ApiPropertyOptional({
    description: 'List of user addresses',
    type: () => [AddressResponseDto],
  })
  addresses?: AddressResponseDto[];

  @ApiPropertyOptional({
    description: 'Access token (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken?: string; // Optional for when we want to include token in response
  refreshToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken: string;
}
