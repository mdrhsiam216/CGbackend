import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { RedisService, LocationData } from '../../shared/redis/redis.service';
import { LocationUpdateResponseDto } from './dto/location.dto';
import { JwtUser } from '../auth/interfaces/auth.interface';
import {
  TransactionStatusMessage,
  MapsErrorMessages,
} from '../../shared/enums';
import { BookingValidationMessage } from '../bookings/enums';
import { CaregiverProfileService } from '../caregiver-profile/caregiver-profile.service';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly redisService: RedisService,
    private readonly caregiverProfileService: CaregiverProfileService,
  ) { }

  /**
   * Validate that user has access to the booking
   */
  async validateBookingAccess(
    bookingId: string,
    user: JwtUser,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'caregiver'],
    });

    if (!booking) {
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    }

    // Check if user is the client or caregiver for this booking
    // booking.caregiverId is the caregiver profile ID, not user ID
    // booking.caregiver.user.id is the user ID of the caregiver
    const isAuthorized =
      booking.userId === user.userId ||
      booking.caregiver?.user?.id === user.userId;

    if (!isAuthorized) {
      throw new ForbiddenException(
        MapsErrorMessages.UNAUTHORIZED_BOOKING_ACCESS,
      );
    }

    return booking;
  }

  /**
   * Validate that caregiver can update location (booking must be in_progress)
   */
  async validateLocationUpdate(
    bookingId: string,
    userId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    }

    // Get caregiver profile ID from user ID
    const caregiverProfile = await this.caregiverProfileService.findByUserId(
      userId,
    );
    if (!caregiverProfile) {
      throw new NotFoundException(
        MapsErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }

    if (booking.caregiverId !== caregiverProfile.id) {
      throw new ForbiddenException(
        MapsErrorMessages.ONLY_ASSIGNED_CAREGIVER_CAN_UPDATE,
      );
    }

    if (booking.status !== TransactionStatusMessage.IN_PROGRESS) {
      throw new BadRequestException(
        MapsErrorMessages.LOCATION_UPDATE_ONLY_IN_PROGRESS,
      );
    }

    if (!booking.clockInTime) {
      throw new BadRequestException(
        MapsErrorMessages.CAREGIVER_MUST_CLOCK_IN,
      );
    }

    return booking;
  }

  /**
   * Update caregiver location and cache it in Redis
   */
  async updateCaregiverLocation(
    bookingId: string,
    userId: string,
    lat: number,
    lng: number,
  ): Promise<LocationUpdateResponseDto> {
    // Validate booking and permissions
    const booking = await this.validateLocationUpdate(bookingId, userId);

    // Get caregiver profile ID
    const caregiverProfile = await this.caregiverProfileService.findByUserId(
      userId,
    );
    if (!caregiverProfile) {
      throw new NotFoundException(
        MapsErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }

    // Create location data
    const locationData: LocationData = {
      caregiverId: caregiverProfile.id,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    };

    // Cache in Redis with 24 hour TTL
    await this.redisService.cacheLocation(bookingId, locationData, 86400);

    return {
      lat,
      lng,
      timestamp: locationData.timestamp,
      bookingId,
    };
  }

  /**
   * Get last known location from cache
   */
  async getLastLocation(
    bookingId: string,
    user: JwtUser,
  ): Promise<LocationUpdateResponseDto | null> {
    // Validate booking access
    await this.validateBookingAccess(bookingId, user);

    // Get from Redis cache
    const locationData = await this.redisService.getLocation(bookingId);

    if (!locationData) {
      return null;
    }

    return {
      lat: locationData.lat,
      lng: locationData.lng,
      timestamp: locationData.timestamp,
      bookingId,
    };
  }

  /**
   * Delete location cache when booking ends
   */
  async deleteLocationCache(bookingId: string): Promise<void> {
    await this.redisService.deleteLocation(bookingId);
  }
}
