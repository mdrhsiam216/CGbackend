import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EmergencyContactsDto } from '../../bookings/dtos/emergency-contact.dto';

export class ProfileResponseDto {
  @ApiProperty({ example: 'Safiul' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Alam' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: '+880 17847 74530' })
  @Expose()
  primaryPhone: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '1999-12-31' })
  @Expose()
  dateOfBirth: Date;

  @ApiProperty({ example: 'Male' })
  @Expose()
  gender: string;

  @ApiProperty({ example: 'House 23, Road 7' })
  @Expose()
  addressLine1: string;

  @ApiProperty({ example: 'Dhanmondi' })
  @Expose()
  addressLine2: string;

  @ApiProperty({ example: 'Dhaka' })
  @Expose()
  city: string;

  @ApiProperty({ example: 'Dhaka Division' })
  @Expose()
  state: string;

  @ApiProperty({ example: '1205' })
  @Expose()
  zipCode: string;

  @ApiPropertyOptional({ type: EmergencyContactsDto })
  @Expose()
  @Type(() => EmergencyContactsDto)
  emergencyContacts?: EmergencyContactsDto;
}
