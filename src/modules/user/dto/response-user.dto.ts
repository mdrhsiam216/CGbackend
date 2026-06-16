import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyContactsDto } from '../../bookings/dtos/emergency-contact.dto';

class RoleDto {
  @ApiProperty({ description: 'Role ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Role name', example: 'Admin' })
  @Expose()
  name: string;
}

class UserRoleDto {
  @ApiProperty({ description: 'User-Role mapping ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Role details', type: () => RoleDto })
  @Expose()
  @Type(() => RoleDto)
  role: RoleDto;
}

class ClientProfileDto {
  @ApiProperty({ description: 'Client profile ID' })
  @Expose()
  id: string;
}

class CaregiverProfileDto {
  @ApiProperty({ description: 'Caregiver profile ID' })
  @Expose()
  id: string;
}

export class ResponseUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Expose()
  firstName?: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Expose()
  lastName?: string;

  @Exclude()
  password: string;

  @ApiProperty({ description: 'User phone number', example: '+1234567890' })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'User status', example: 'ACTIVE' })
  @Expose()
  status: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({ description: 'User creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'User roles', type: [UserRoleDto] })
  @Expose()
  @Type(() => UserRoleDto)
  userRoles?: UserRoleDto[];

  @ApiPropertyOptional({
    description: 'Client profile if user is a client',
    type: () => ClientProfileDto,
  })
  @Expose()
  @Type(() => ClientProfileDto)
  clientProfile?: ClientProfileDto;

  @ApiPropertyOptional({
    description: 'Caregiver profile if user is a caregiver',
    type: () => CaregiverProfileDto,
  })
  @Expose()
  @Type(() => CaregiverProfileDto)
  caregiverProfile?: CaregiverProfileDto;

  @ApiPropertyOptional({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @Expose()
  @Type(() => EmergencyContactsDto)
  emergencyContacts?: EmergencyContactsDto;
}
