import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  AvailabilitySlotErrorMessages,
  CaregiverProfileErrorMessages,
} from 'src/shared/enums';
import { BookingRepository } from '../bookings/booking-caregiver.repository';
import { CaregiverProfileRepository } from '../caregiver-profile/repositories/caregiver-profile.repository';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { GetAvailableTimeSlotsDto } from './dto/get-available-time-slots.dto';
import { QueryAvailabilitySlotDto } from './dto/query-availability-slot-dto';
import { ResponseAvailabilitySlotDto } from './dto/response-availability-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-availability-slot.dto';
import {
  AvailabilitySlot,
  TimeSlot,
} from './entities/availability-slot.entity';
import { AvailabilitySlotRepository } from './repository/availability-slot.repository';

@Injectable()
export class AvailabilitySlotService {
  constructor(
    private readonly availabilitySlotRepository: AvailabilitySlotRepository,
    private readonly caregiverProfileRepository: CaregiverProfileRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async create(
    userId: string,
    createDto: CreateAvailabilitySlotDto,
  ): Promise<ResponseAvailabilitySlotDto[]> {
    try {
      const caregiver = await this.getCaregiverByUserId(userId);

      if (createDto.expectedMinRate && createDto.expectedMaxRate) {
        this.validatePayRange(
          createDto.expectedMinRate,
          createDto.expectedMaxRate,
        );
      }

      if (createDto.startTime.length !== createDto.endTime.length) {
        throw new BadRequestException(
          AvailabilitySlotErrorMessages.ARRAY_LENGTH_MISMATCH,
        );
      }

      // Validate timeSlots array length if provided
      if (
        createDto.timeSlots &&
        createDto.timeSlots.length !== createDto.startTime.length
      ) {
        throw new BadRequestException(
          AvailabilitySlotErrorMessages.ARRAY_LENGTH_MISMATCH,
        );
      }

      const createdSlots: ResponseAvailabilitySlotDto[] = [];

      for (let i = 0; i < createDto.startTime.length; i++) {
        const startTime = createDto.startTime[i];
        const endTime = createDto.endTime[i];
        const timeSlot = createDto.timeSlots?.[i] ?? null;

        this.validateTimes(startTime, endTime);

        await this.checkForOverlaps(
          caregiver.id,
          createDto.daysOfWeek,
          startTime,
          endTime,
        );

        const slotData = {
          caregiver,
          caregiverId: caregiver.id,
          daysOfWeek: createDto.daysOfWeek,
          timeSlots: timeSlot ? [timeSlot] : null,
          startTime: startTime,
          endTime: endTime,
          scheduleMayVary: createDto.scheduleMayVary ?? false,
          expectedMinRate: createDto.expectedMinRate ?? null,
          expectedMaxRate: createDto.expectedMaxRate ?? null,
          isActive: true,
        };

        const slot = await this.availabilitySlotRepository.createSlot(slotData);
        createdSlots.push(this.transformToResponse(slot));
      }

      return createdSlots;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_CREATION_FAILED,
      );
    }
  }

  async findAll(queryDto: QueryAvailabilitySlotDto): Promise<{
    data: ResponseAvailabilitySlotDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10 } = queryDto;

      const { data, total } =
        await this.availabilitySlotRepository.findAll(queryDto);

      return {
        data: plainToInstance(ResponseAvailabilitySlotDto, data, {
          excludeExtraneousValues: true,
        }),
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_FETCH_FAILED,
      );
    }
  }

  async findOne(id: string): Promise<ResponseAvailabilitySlotDto> {
    try {
      const slot = await this.availabilitySlotRepository.findById(id);

      if (!slot) {
        throw new NotFoundException(
          AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_NOT_FOUND,
        );
      }

      return this.transformToResponse(slot);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_FETCH_FAILED,
      );
    }
  }

  async findByCaregiverId(
    caregiverId: string,
  ): Promise<ResponseAvailabilitySlotDto[]> {
    try {
      await this.validateCaregiverExists(caregiverId);

      const slots =
        await this.availabilitySlotRepository.findByCaregiverId(caregiverId);

      return plainToInstance(ResponseAvailabilitySlotDto, slots, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_FETCH_FAILED,
      );
    }
  }

  async findByUserId(userId: string): Promise<ResponseAvailabilitySlotDto[]> {
    try {
      const caregiver = await this.getCaregiverByUserId(userId);

      const slots = await this.availabilitySlotRepository.findByCaregiverId(
        caregiver.id,
      );

      return plainToInstance(ResponseAvailabilitySlotDto, slots, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_FETCH_FAILED,
      );
    }
  }

  async findAvailableSlots(
    caregiverId: string,
    daysOfWeek?: number[],
    timeSlots?: string[],
  ): Promise<ResponseAvailabilitySlotDto[]> {
    try {
      await this.validateCaregiverExists(caregiverId);

      const slots = await this.availabilitySlotRepository.findAvailableSlots(
        caregiverId,
        daysOfWeek,
        timeSlots,
      );

      return plainToInstance(ResponseAvailabilitySlotDto, slots, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_FETCH_FAILED,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateAvailabilitySlotDto,
  ): Promise<ResponseAvailabilitySlotDto> {
    try {
      const slot = await this.availabilitySlotRepository.findById(id);

      if (!slot) {
        throw new NotFoundException(
          AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_NOT_FOUND,
        );
      }

      const updateData: any = { ...updateDto };

      if (updateDto.startTime && Array.isArray(updateDto.startTime)) {
        if (updateDto.startTime.length !== 1) {
          throw new BadRequestException(
            AvailabilitySlotErrorMessages.UPDATE_SINGLE_SLOT_ONLY,
          );
        }
        updateData.startTime = updateDto.startTime[0];
      }

      if (updateDto.endTime && Array.isArray(updateDto.endTime)) {
        if (updateDto.endTime.length !== 1) {
          throw new BadRequestException(
            AvailabilitySlotErrorMessages.UPDATE_SINGLE_SLOT_ONLY,
          );
        }
        updateData.endTime = updateDto.endTime[0];
      }

      // Validate times if provided
      if (updateData.startTime || updateData.endTime) {
        const startTime = updateData.startTime ?? slot.startTime;
        const endTime = updateData.endTime ?? slot.endTime;
        this.validateTimes(startTime, endTime);
      }

      // Validate pay range if provided
      // If both are provided, validate them together
      if (
        updateData.expectedMinRate !== undefined &&
        updateData.expectedMaxRate !== undefined
      ) {
        this.validatePayRange(
          updateData.expectedMinRate,
          updateData.expectedMaxRate,
        );
      } else if (updateData.expectedMinRate !== undefined) {
        // If only minRate is provided, validate against existing maxRate
        const maxRate = updateData.expectedMaxRate ?? slot.expectedMaxRate;
        if (maxRate !== null && maxRate !== undefined) {
          this.validatePayRange(updateData.expectedMinRate, maxRate);
        }
      } else if (updateData.expectedMaxRate !== undefined) {
        // If only maxRate is provided, validate against existing minRate
        const minRate = updateData.expectedMinRate ?? slot.expectedMinRate;
        if (minRate !== null && minRate !== undefined) {
          this.validatePayRange(minRate, updateData.expectedMaxRate);
        }
      }

      // Check for overlaps if days or times changed
      if (updateData.daysOfWeek || updateData.startTime || updateData.endTime) {
        const daysOfWeek = updateData.daysOfWeek ?? slot.daysOfWeek;
        const startTime = updateData.startTime ?? slot.startTime;
        const endTime = updateData.endTime ?? slot.endTime;

        await this.checkForOverlaps(
          slot.caregiverId,
          daysOfWeek,
          startTime,
          endTime,
          id,
        );
      }

      Object.assign(slot, updateData);
      const updatedSlot = await this.availabilitySlotRepository.update(slot);

      return this.transformToResponse(updatedSlot);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_UPDATE_FAILED,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const slot = await this.availabilitySlotRepository.findById(id);

      if (!slot) {
        throw new NotFoundException(
          AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_NOT_FOUND,
        );
      }

      await this.availabilitySlotRepository.remove(slot);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_DELETION_FAILED,
      );
    }
  }

  async removeAllByCaregiverId(caregiverId: string): Promise<void> {
    try {
      await this.validateCaregiverExists(caregiverId);
      await this.availabilitySlotRepository.removeByCaregiverId(caregiverId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_DELETION_FAILED,
      );
    }
  }

  async deactivateSlot(id: string): Promise<ResponseAvailabilitySlotDto> {
    try {
      const slot = await this.availabilitySlotRepository.findById(id);

      if (!slot) {
        throw new NotFoundException(
          AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_NOT_FOUND,
        );
      }

      slot.isActive = false;
      const updatedSlot = await this.availabilitySlotRepository.update(slot);

      return this.transformToResponse(updatedSlot);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABILITY_SLOT_UPDATE_FAILED,
      );
    }
  }

  // Helper methods
  private async getCaregiverByUserId(userId: string) {
    const caregiver =
      await this.caregiverProfileRepository.findByUserId(userId);

    if (!caregiver) {
      throw new NotFoundException(
        AvailabilitySlotErrorMessages.CAREGIVER_PROFILE_NOT_FOUND_CREATE_FIRST,
      );
    }

    return caregiver;
  }

  private async validateCaregiverExists(caregiverId: string) {
    const caregiver =
      await this.caregiverProfileRepository.findById(caregiverId);

    if (!caregiver) {
      throw new NotFoundException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }

    return caregiver;
  }

  private validateTimes(startTime: string, endTime: string): void {
    // Normalize time format to HH:MM (ensure two-digit hours)
    const normalizeTime = (time: string): string => {
      const [hour, minute] = time.split(':');
      return `${hour.padStart(2, '0')}:${minute}`;
    };

    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);

    // Parse times
    const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
    const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Start time must be before end time
    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.START_TIME_BEFORE_END_TIME,
      );
    }

    // Validate business hours (6 AM to 10 PM)
    // 6 AM = 360 minutes, 10 PM = 1320 minutes (22:00)
    const minBusinessMinutes = 6 * 60; // 360 minutes (6:00 AM)
    const maxBusinessMinutes = 22 * 60; // 1320 minutes (10:00 PM)

    if (startMinutes < minBusinessMinutes || endMinutes > maxBusinessMinutes) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.TIMES_WITHIN_BUSINESS_HOURS,
      );
    }

    // Minimum duration check (at least 1 hour)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 60) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.MINIMUM_DURATION_ONE_HOUR,
      );
    }
  }

  private validatePayRange(minRate: number, maxRate: number): void {
    if (minRate < 0 || maxRate < 0) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.PAY_RATE_NEGATIVE,
      );
    }

    if (minRate > maxRate) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.MIN_RATE_EXCEEDS_MAX_RATE,
      );
    }

    // Optional: validate reasonable pay range
    if (maxRate > 200) {
      throw new BadRequestException(
        AvailabilitySlotErrorMessages.MAX_RATE_UNREASONABLE,
      );
    }
  }

  private async checkForOverlaps(
    caregiverId: string,
    daysOfWeek: number[],
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<void> {
    const existingSlots =
      await this.availabilitySlotRepository.findByCaregiverId(caregiverId);

    for (const slot of existingSlots) {
      if (excludeSlotId && slot.id === excludeSlotId) {
        continue;
      }

      if (!slot.isActive) {
        continue;
      }

      // Check if any days overlap
      const dayOverlap = daysOfWeek.some((day) =>
        slot.daysOfWeek.includes(day),
      );

      if (dayOverlap) {
        // Check if times overlap
        const timeOverlap = this.checkTimeOverlap(
          startTime,
          endTime,
          slot.startTime,
          slot.endTime,
        );

        if (timeOverlap) {
          throw new ConflictException(
            AvailabilitySlotErrorMessages.OVERLAPPING_SLOT,
          );
        }
      }
    }
  }

  private checkTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const [start1Hour, start1Min] = start1.split(':').map(Number);
    const [end1Hour, end1Min] = end1.split(':').map(Number);
    const [start2Hour, start2Min] = start2.split(':').map(Number);
    const [end2Hour, end2Min] = end2.split(':').map(Number);

    const start1Minutes = start1Hour * 60 + start1Min;
    const end1Minutes = end1Hour * 60 + end1Min;
    const start2Minutes = start2Hour * 60 + start2Min;
    const end2Minutes = end2Hour * 60 + end2Min;

    // Check if time ranges overlap
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  private transformToResponse(
    slot: AvailabilitySlot,
  ): ResponseAvailabilitySlotDto {
    return plainToInstance(ResponseAvailabilitySlotDto, slot, {
      excludeExtraneousValues: true,
    });
  }

  // Utility method to get time slot hours
  getTimeSlotHours(timeSlot: TimeSlot): { start: string; end: string } {
    const timeSlotMap = {
      [TimeSlot.MORNINGS]: { start: '06:00', end: '12:00' },
      [TimeSlot.AFTERNOONS]: { start: '12:00', end: '18:00' },
      [TimeSlot.EVENINGS]: { start: '18:00', end: '22:00' },
      [TimeSlot.OVERNIGHT]: { start: '22:00', end: '06:00' },
    };

    return timeSlotMap[timeSlot];
  }

  /**
   * Get available time slots for a specific caregiver on a given date and duration
   * Returns array of available start times that can accommodate the requested duration
   */
  async getAvailableTimeSlots(
    caregiverId: string,
    dto: GetAvailableTimeSlotsDto,
  ): Promise<string[]> {
    try {
      // Validate caregiver exists
      await this.validateCaregiverExists(caregiverId);

     
      let bookingDate: Date;
      let normalizedDateStr: string = dto.date;

      if (/^\d{4}-\d{2}-\d{2}$/.test(dto.date)) {
        bookingDate = new Date(dto.date);
      } else {
        const parts = dto.date.split(/[/-]/);
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          bookingDate = new Date(y, m - 1, d);
          normalizedDateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        } else {
          bookingDate = new Date(dto.date);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);

      if (isNaN(bookingDate.getTime()) || bookingDate < today) {
        throw new BadRequestException(
          AvailabilitySlotErrorMessages.BOOKING_DATE_IN_PAST,
        );
      }

      // Validate duration is reasonable (max 24 hours)
      if (dto.durationHours > 24) {
        throw new BadRequestException(
          AvailabilitySlotErrorMessages.DURATION_EXCEEDS_MAXIMUM,
        );
      }

      // Parse the date to get day of week (0-6)
      const dayOfWeek = bookingDate.getDay();

      // Get all active slots for this caregiver on this day of week
      const slots =
        await this.availabilitySlotRepository.findByCaregiverId(caregiverId);
      const availableSlots = slots.filter(
        (slot) => slot.isActive && slot.daysOfWeek.includes(dayOfWeek),
      );

      if (availableSlots.length === 0) {
        return [];
      }

      // Generate available start times
      const availableStartTimes: string[] = [];

      for (const slot of availableSlots) {
        const startTimes = this.generateAvailableStartTimes(
          slot.startTime,
          slot.endTime,
          dto.durationHours,
        );
        availableStartTimes.push(...startTimes);
      }

      // Remove duplicates and sort
      const uniqueTimes = [...new Set(availableStartTimes)].sort();

      // Check for existing bookings and filter out booked times with buffer
      const availableTimesAfterBookingCheck: string[] = [];

      for (const startTime of uniqueTimes) {
        // Check if this time slot conflicts with any existing bookings (including buffer)
        const hasConflict = await this.checkBookingConflictWithBuffer(
          caregiverId,
          dto.date,
          startTime,
          dto.durationHours,
        );

        // If no conflicts (including buffer), this time is available
        if (!hasConflict) {
          availableTimesAfterBookingCheck.push(startTime);
        }
      }

      return availableTimesAfterBookingCheck;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        AvailabilitySlotErrorMessages.AVAILABLE_TIME_SLOTS_FETCH_FAILED,
      );
    }
  }

  /**
   * Generate available start times within a slot that can accommodate the duration
   * Returns times in 30-minute intervals
   */
  private generateAvailableStartTimes(
    slotStart: string,
    slotEnd: string,
    durationHours: number,
  ): string[] {
    const availableTimes: string[] = [];

    // Parse start and end times
    const [startHour, startMin] = slotStart.split(':').map(Number);
    const [endHour, endMin] = slotEnd.split(':').map(Number);

    const slotStartMinutes = startHour * 60 + startMin;
    const slotEndMinutes = endHour * 60 + endMin;
    const durationMinutes = durationHours * 60;

    // Generate time slots in 30-minute intervals
    // Only include times where startTime + duration <= slotEndTime
    for (
      let currentMinutes = slotStartMinutes;
      currentMinutes + durationMinutes <= slotEndMinutes;
      currentMinutes += 30
    ) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      availableTimes.push(timeString);
    }

    return availableTimes;
  }

  /**
   * Check if a booking conflicts with existing bookings including 30-minute buffer time
   * Buffer time is needed for caregiver to travel between locations
   */
  private async checkBookingConflictWithBuffer(
    caregiverId: string,
    date: string,
    startTime: string,
    durationHours: number,
  ): Promise<boolean> {
    const existingBookings =
      await this.bookingRepository.findOverlappingBookings(
        caregiverId,
        date,
        '00:00',
        24,
      );

    // Filter to include only bookings that block caregiver's time
    // Include: confirmed, in_progress (exclude: pending, cancelled, completed)
    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === 'confirmed' || booking.status === 'in_progress',
    );

    if (activeBookings.length === 0) {
      return false;
    }

    // Parse the new booking time
    const [newStartH, newStartM] = startTime.split(':').map(Number);
    const newStartMinutes = newStartH * 60 + newStartM;
    const newEndMinutes = newStartMinutes + durationHours * 60;

    // Check each existing booking for conflicts (including buffer)
    for (const booking of activeBookings) {
      const [existingStartH, existingStartM] = booking.startTime
        .split(':')
        .map(Number);
      const existingStartMinutes = existingStartH * 60 + existingStartM;
      const existingEndMinutes = existingStartMinutes + booking.duration * 60;

      // Add 30-minute buffer after existing booking
      const existingEndWithBuffer = existingEndMinutes + 30;

      // Check for conflicts:
      // 1. New booking starts before existing booking ends (with buffer)
      // 2. New booking ends after existing booking starts
      const hasConflict =
        newStartMinutes < existingEndWithBuffer &&
        newEndMinutes > existingStartMinutes;

      if (hasConflict) {
        return true;
      }
    }

    return false;
  }

  async isSlotAvailable(
    caregiverId: string,
    date: string,
    startTime: string,
    durationHours: number,
  ): Promise<boolean> {
    // 1. Normalize and Parse date
    let bookingDate: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      bookingDate = new Date(date);
    } else {
      const parts = date.split(/[/-]/);
      if (parts.length === 3) {
       
        const [d, m, y] = parts.map(Number);
        bookingDate = new Date(y, m - 1, d);
      } else {
        bookingDate = new Date(date);
      }
    }

    if (isNaN(bookingDate.getTime())) {
      return false;
    }

    
    const isWithinRecurring = await this.checkSlots(
      caregiverId,
      bookingDate,
      startTime,
      durationHours,
    );

    if (!isWithinRecurring) {
      return false;
    }

    
    const hasBookingConflict = await this.checkBookingConflictWithBuffer(
      caregiverId,
      date,
      startTime,
      durationHours,
    );

   
    return !hasBookingConflict;
  }

  private async checkSlots(
    caregiverId: string,
    bookingDate: Date,
    startTime: string,
    durationHours: number,
  ): Promise<boolean> {
    const dayOfWeek = bookingDate.getDay();

    const slots =
      await this.availabilitySlotRepository.findByCaregiverId(caregiverId);
    const activeSlots = slots.filter(
      (s) => s.isActive && s.daysOfWeek.includes(dayOfWeek),
    );

    if (activeSlots.length === 0) return false;

    const [startH, startM] = startTime.split(':').map(Number);
    const bookingStartMinutes = startH * 60 + startM;
    const bookingEndMinutes = bookingStartMinutes + durationHours * 60;

    for (const slot of activeSlots) {
      const [slotStartH, slotStartM] = slot.startTime.split(':').map(Number);
      const [slotEndH, slotEndM] = slot.endTime.split(':').map(Number);
      const slotStartMinutes = slotStartH * 60 + slotStartM;
      const slotEndMinutes = slotEndH * 60 + slotEndM;

      if (
        bookingStartMinutes >= slotStartMinutes &&
        bookingEndMinutes <= slotEndMinutes
      ) {
        return true;
      }
    }

    return false;
  }
}
