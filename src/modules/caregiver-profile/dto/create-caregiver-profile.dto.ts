import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DayOfWeek,
  TimeSlot,
} from 'src/modules/availability-slot/entities/availability-slot.entity';
import { CreateAddressDto } from '../../address/dto/create-address.dto';

export class CreateCertificateNestedDto {
  @ApiProperty({
    example: 'Bachelor of Nursing',
    description: 'Title of the certificate/education',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Harvard University',
    description: 'Institution where the certificate was obtained',
  })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional({
    example: '2020',
    description: 'Year of completion',
  })
  @IsOptional()
  @IsString()
  yearOfCompletion?: string;

  @ApiProperty({
    example: 'https://example.com/certificate.pdf',
    description: 'URL of the certificate document',
  })
  @IsNotEmpty()
  @IsString()
  certificateUrl: string;

  @ApiProperty({
    example: 'certificates/user123/certificate.pdf',
    description: 'Storage key for the certificate document',
  })
  @IsNotEmpty()
  @IsString()
  certificateKey: string;
}

export class CreateAvailabilitySlotNestedDto {
  @ApiProperty({
    description: 'Days of the week (0-6, where 0 is Sunday)',
    enum: DayOfWeek,
    isArray: true,
    example: [1, 2, 3, 4, 5],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one day must be selected' })
  @IsEnum(DayOfWeek, { each: true })
  @Type(() => Number)
  daysOfWeek: number[];

  @ApiPropertyOptional({
    description: 'Time slots (e.g., mornings, afternoons)',
    enum: TimeSlot,
    isArray: true,
    example: ['mornings', 'afternoons'],
  })
  @IsArray()
  @IsEnum(TimeSlot, { each: true })
  @IsOptional()
  timeSlots?: string[];

  @ApiProperty({
    description: 'Start time in HH:MM format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:MM format',
    example: '17:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Indicates if the schedule may vary',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  scheduleMayVary?: boolean;

  @ApiPropertyOptional({
    description: 'Expected minimum hourly rate',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMinRate?: number;

  @ApiPropertyOptional({
    description: 'Expected maximum hourly rate',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMaxRate?: number;
}

export class AvailabilityByDayDto {
  @ApiPropertyOptional({
    description: 'Sunday availability - array of time slot names',
    example: ['MORNING', 'AFTERNOON', 'EVENING'],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  0?: string[];

  @ApiPropertyOptional({
    description: 'Monday availability - array of time slot names',
    example: ['EVENING'],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  1?: string[];

  @ApiPropertyOptional({
    description: 'Tuesday availability - array of time slot names',
    example: ['MORNING', 'AFTERNOON'],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  2?: string[];

  @ApiPropertyOptional({
    description: 'Wednesday availability - array of time slot names',
    example: [],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  3?: string[];

  @ApiPropertyOptional({
    description: 'Thursday availability - array of time slot names',
    example: ['MORNING', 'EVENING'],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  4?: string[];

  @ApiPropertyOptional({
    description: 'Friday availability - array of time slot names',
    example: ['MORNING'],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  5?: string[];

  @ApiPropertyOptional({
    description: 'Saturday availability - array of time slot names',
    example: [],
    type: [String],
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'OVERNIGHT'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  6?: string[];
}

export class AvailabilityDto {
  @ApiProperty({
    description:
      'Availability mapped by day of week (0=Sunday, 6=Saturday). Time slots: MORNING (6am-12pm), AFTERNOON (12pm-6pm), EVENING (6pm-10pm), OVERNIGHT (10pm-6am)',
    type: AvailabilityByDayDto,
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
  @ValidateNested()
  @Type(() => AvailabilityByDayDto)
  availabilityByDay: AvailabilityByDayDto;

  @ApiPropertyOptional({
    description: 'Indicates if the schedule may vary',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  scheduleMayVary?: boolean;

  @ApiPropertyOptional({
    description: 'Expected minimum hourly rate',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMinRate?: number;

  @ApiPropertyOptional({
    description: 'Expected maximum hourly rate',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedMaxRate?: number;
}

export class CreateCaregiverProfileDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID associated with the profile',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the caregiver',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the caregiver',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Male',
    description: 'Gender of the caregiver',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Phone number of the caregiver',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth of the caregiver (YYYY-MM-DD format)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: '1234567890123',
    description: 'National ID number of the caregiver',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nid?: string;

  @ApiPropertyOptional({
    example: 'Experienced caregiver...',
    description: 'Bio of the caregiver',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    example: 25.5,
    description: 'Base hourly rate in USD',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseHourlyRate?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience as a caregiver',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    example: ["Alzheimer's Care", 'Dementia Care', 'Personal Care Assistance'],
    description: 'List of specializations',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  @ApiPropertyOptional({
    example: ['English', 'Spanish', 'French'],
    description: 'List of languages spoken',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languageSpoken?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/profile-picture.jpg',
    description: 'URL of the profile picture',
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional({
    example: 'New York, NY',
    description: 'Service area of the caregiver',
  })
  @IsString()
  @IsOptional()
  serviceArea?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Service radius in kilometers',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  radius?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Verification status of the caregiver',
  })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({
    type: CreateAddressDto,
    description: 'Address information for the caregiver',
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  address?: CreateAddressDto;

  @ApiPropertyOptional({
    type: [CreateCertificateNestedDto],
    description: 'List of certificates/education to add with the profile',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCertificateNestedDto)
  @IsOptional()
  certificates?: CreateCertificateNestedDto[];

  @ApiPropertyOptional({
    type: [CreateAvailabilitySlotNestedDto],
    description:
      'List of availability slots to add with the profile (DEPRECATED - use availability instead)',
    deprecated: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAvailabilitySlotNestedDto)
  @IsOptional()
  availabilitySlots?: CreateAvailabilitySlotNestedDto[];

  @ApiPropertyOptional({
    type: AvailabilityDto,
    description:
      'New availability format - maps each day (0-6) to time slots. Takes precedence over availabilitySlots if both provided.',
  })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;
}
