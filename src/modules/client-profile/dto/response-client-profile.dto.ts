import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AddressResponseDto } from '../../address/dto/response-address.dto';

class UserBasicDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'client@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @Expose()
  phone: string;

  @ApiProperty({ example: 'active' })
  @Expose()
  status: string;

  @ApiProperty({ example: 'Jane' })
  @Expose()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName?: string;

  @ApiProperty({ example: 'female' })
  @Expose()
  gender?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;

  @ApiProperty()
  @Expose()
  emergencyContacts: {
    primary: { name: string; phone: string; relationship: string };
    secondary?: { name: string; phone: string; relationship: string };
  };

  @ApiProperty({ type: [AddressResponseDto] })
  @Expose()
  @Type(() => AddressResponseDto)
  addresses: AddressResponseDto[];
}

export class ResponseClientProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ type: UserBasicDto })
  @Expose()
  @Type(() => UserBasicDto)
  user: UserBasicDto;

  @ApiProperty({ example: '1980-01-01' })
  @Expose()
  dateOfBirth: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
