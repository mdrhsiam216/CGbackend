import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Matches,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyContactsDto } from './emergency-contact.dto';
import { CareRecipientDetailsDto } from './care-recipient-details.dto';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Type of service required',
    example: 'Elderly Care',
  })
  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @ApiProperty({
    description: 'Date of the booking in YYYY-MM-DD format',
    example: '2026-01-28',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'Start time of the booking in HH:MM format',
    example: '09:00',
  })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({
    description: 'Duration of the booking in hours',
    example: 4,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Address ID referencing an existing address. The address must be created first using the Address API.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({
    description: 'Email address for contact',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Array of dates of birth for care recipients in YYYY-MM-DD format',
    example: ['1950-05-15', '1960-03-20'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Each careRecipientDateOfBirth must be in YYYY-MM-DD format',
    each: true,
  })
  careRecipientDateOfBirth?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions for the caregiver',
    example: 'Please bring your own lunch.',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Care recipient details',
    type: CareRecipientDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareRecipientDetailsDto)
  careRecipientDetails?: CareRecipientDetailsDto;

  @ApiProperty({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  emergencyContacts: EmergencyContactsDto;

  @ApiProperty({
    description: 'ID of the caregiver',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  caregiverId: string;

  @ApiProperty({
    description: 'ID of the user making the booking',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

export class RebookDto {
  @ApiProperty({
    description: 'Type of service required',
    example: 'Elderly Care',
  })
  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @ApiProperty({
    description: 'Date of the booking in YYYY-MM-DD format',
    example: '2026-01-28',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'Start time of the booking in HH:MM format',
    example: '09:00',
  })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({
    description: 'Duration of the booking in hours',
    example: 4,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Address ID referencing an existing address. The address must be created first using the Address API.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({
    description: 'Email address for contact',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Array of dates of birth for care recipients in YYYY-MM-DD format',
    example: ['1950-05-15', '1960-03-20'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Each careRecipientDateOfBirth must be in YYYY-MM-DD format',
    each: true,
  })
  careRecipientDateOfBirth?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions for the caregiver',
    example: 'Please bring your own lunch.',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Care recipient details',
    type: CareRecipientDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareRecipientDetailsDto)
  careRecipientDetails?: CareRecipientDetailsDto;

  @ApiProperty({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  emergencyContacts: EmergencyContactsDto;

  @ApiProperty({
    description: 'ID of the caregiver',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  caregiverId: string;

  @ApiProperty({
    description: 'ID of the user making the booking',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID of the previous booking to rebook from',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  previousBookingId?: string;

  @ApiPropertyOptional({
    description: 'New date for the rebooking in YYYY-MM-DD format',
    example: '2026-01-29',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'newDate must be in YYYY-MM-DD format',
  })
  newDate?: string;

  @ApiPropertyOptional({
    description: 'New start time for the rebooking in HH:MM format',
    example: '10:00',
  })
  @IsOptional()
  @IsString()
  newTime?: string;
}

export class CreateBookingRequestDto {
  @ApiProperty({
    description: 'Type of service required',
    example: 'Elderly Care',
  })
  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @ApiProperty({
    description: 'Date of the booking in YYYY-MM-DD format',
    example: '2026-01-28',  
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'Start time of the booking in HH:MM format',
    example: '09:00',
  })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({
    description: 'Duration of the booking in hours',
    example: 4,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Address ID referencing an existing address. The address must be created first using the Address API.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({
    description: 'Email address for contact',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Array of dates of birth for care recipients in YYYY-MM-DD format',
    example: ['1950-05-15', '1960-03-20'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Each careRecipientDateOfBirth must be in YYYY-MM-DD format',
    each: true,
  })
  careRecipientDateOfBirth?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions for the caregiver',
    example: 'Please bring your own lunch.',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Care recipient details',
    type: CareRecipientDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareRecipientDetailsDto)
  careRecipientDetails?: CareRecipientDetailsDto;

  @ApiProperty({
    description: 'Emergency contacts',
    type: EmergencyContactsDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  emergencyContacts: EmergencyContactsDto;

  @ApiProperty({
    description: 'ID of the caregiver',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  caregiverId: string;
}
