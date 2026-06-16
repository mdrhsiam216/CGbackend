import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class JoinBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class LocationUpdateResponseDto {
  lat: number;
  lng: number;
  timestamp: string;
  bookingId: string;
}
