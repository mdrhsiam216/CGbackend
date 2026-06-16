import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseCertificateDto } from '../../certificate/dto/response-certificate.dto';
import { ResponseAvailabilitySlotDto } from 'src/modules/availability-slot/dto/response-availability-slot.dto';
import { AddressResponseDto } from '../../address/dto/response-address.dto';

class UserBasicDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @Expose()
  phone: string;

  @ApiProperty({ example: 'active' })
  @Expose()
  status: string;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @Expose()
  gender?: string;
}

class HomeLocationResponseDto {
  @ApiProperty({ example: 40.7128 })
  @Expose()
  lat: number;

  @ApiProperty({ example: -74.006 })
  @Expose()
  lng: number;
}

class ResponseAvailabilityByDayDto {
  @ApiPropertyOptional({
    description: 'Sunday availability',
    isArray: true,
    example: ['MORNING', 'AFTERNOON', 'EVENING'],
  })
  @Expose()
  0?: string[];

  @ApiPropertyOptional({
    description: 'Monday availability',
    isArray: true,
    example: ['EVENING'],
  })
  @Expose()
  1?: string[];

  @ApiPropertyOptional({
    description: 'Tuesday availability',
    isArray: true,
    example: ['MORNING', 'AFTERNOON'],
  })
  @Expose()
  2?: string[];

  @ApiPropertyOptional({
    description: 'Wednesday availability',
    isArray: true,
    example: [],
  })
  @Expose()
  3?: string[];

  @ApiPropertyOptional({
    description: 'Thursday availability',
    isArray: true,
    example: ['MORNING', 'EVENING'],
  })
  @Expose()
  4?: string[];

  @ApiPropertyOptional({
    description: 'Friday availability',
    isArray: true,
    example: ['MORNING'],
  })
  @Expose()
  5?: string[];

  @ApiPropertyOptional({
    description: 'Saturday availability',
    isArray: true,
    example: [],
  })
  @Expose()
  6?: string[];
}

class ResponseAvailabilityDto {
  @ApiProperty({
    description: 'Availability mapped by day of week (0=Sunday, 6=Saturday)',
    type: ResponseAvailabilityByDayDto,
    example: {
      0: ['MORNING', 'AFTERNOON', 'EVENING'],
      1: ['EVENING'],
      2: ['MORNING', 'AFTERNOON'],
      3: [],
      4: ['MORNING', 'EVENING'],
      5: ['MORNING'],
      6: [],
    },
  })
  @Expose()
  @Type(() => ResponseAvailabilityByDayDto)
  availabilityByDay: ResponseAvailabilityByDayDto;

  @ApiPropertyOptional({
    description: 'Indicates if the schedule may vary',
    example: false,
  })
  @Expose()
  @Type(() => Boolean)
  scheduleMayVary?: boolean;

  @ApiPropertyOptional({
    description: 'Expected minimum hourly rate',
  })
  @Expose()
  @Type(() => Number)
  expectedMinRate?: number;

  @ApiPropertyOptional({
    description: 'Expected maximum hourly rate',
  })
  @Expose()
  @Type(() => Number)
  expectedMaxRate?: number;
}

export class ResponseCaregiverProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ type: UserBasicDto })
  @Expose()
  @Type(() => UserBasicDto)
  user: UserBasicDto;

  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Phone number of the caregiver',
  })
  @Expose()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth of the caregiver',
  })
  @Expose()
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    example: '1234567890123',
    description: 'National ID number of the caregiver',
  })
  @Expose()
  nid?: string;

  @ApiPropertyOptional({ example: 'Experienced caregiver...' })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({ example: 25.5 })
  @Expose()
  baseHourlyRate?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience as a caregiver',
  })
  @Expose()
  yearsOfExperience?: number | null;

  @ApiPropertyOptional({
    example: ["Alzheimer's Care", 'Dementia Care', 'Personal Care Assistance'],
    description: 'List of specializations',
    type: [String],
  })
  @Expose()
  specializations?: string[];

  @ApiPropertyOptional({
    example: ['English', 'Spanish', 'French'],
    description: 'List of languages spoken',
    type: [String],
  })
  @Expose()
  languageSpoken?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/profile-picture.jpg',
    description: 'URL of the profile picture',
  })
  @Expose()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ example: 'New York, NY' })
  @Expose()
  serviceArea?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Service radius in kilometers',
  })
  @Expose()
  radius?: number;

  @ApiPropertyOptional({
    type: AddressResponseDto,
    description: 'Address information for the caregiver',
  })
  @Expose()
  @Type(() => AddressResponseDto)
  address?: AddressResponseDto;

  @ApiProperty({ example: false })
  @Expose()
  verified: boolean;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Average rating from reviews',
  })
  @Expose()
  averageRating?: number;

  @ApiPropertyOptional({ example: 23, description: 'Total number of reviews' })
  @Expose()
  totalReviews?: number;

  @ApiPropertyOptional({
    type: [ResponseCertificateDto],
    description: 'List of certificates',
  })
  @Expose()
  @Type(() => ResponseCertificateDto)
  certificates?: ResponseCertificateDto[];

  @ApiPropertyOptional({
    type: [ResponseAvailabilitySlotDto],
    description:
      'List of availability slots (DEPRECATED - use availability field instead)',
    deprecated: true,
  })
  @Expose()
  @Type(() => ResponseAvailabilitySlotDto)
  availabilitySlots?: ResponseAvailabilitySlotDto[];

  @ApiPropertyOptional({
    type: ResponseAvailabilityDto,
    description:
      'Availability in new format - automatically transformed from availability slots',
    example: {
      availabilityByDay: {
        0: ['MORNING', 'AFTERNOON', 'EVENING'],
        1: ['EVENING'],
        2: ['MORNING', 'AFTERNOON'],
        3: [],
        4: ['MORNING', 'EVENING'],
        5: ['MORNING'],
        6: [],
      },
    },
  })
  @Expose()
  @Type(() => ResponseAvailabilityDto)
  availability?: ResponseAvailabilityDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
