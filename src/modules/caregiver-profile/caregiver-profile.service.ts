import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  CaregiverProfileErrorMessages,
  CaregiverProfileLoggerMessages,
  UserErrorMessages,
} from 'src/shared/enums';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';
import { UserService } from '../user/user.service';
import {
  AvailabilityDto,
  CreateCaregiverProfileDto,
} from './dto/create-caregiver-profile.dto';
import { QueryCaregiverProfileDto } from './dto/query-caregiver-profile.dto';
import { QueryNearbyCaregiverProfileDto } from './dto/query-nearby-caregiver-profile.dto';
import { ResponseCaregiverProfileDto } from './dto/response-caregiver-profile.dto';
import { UpdateCaregiverProfileDto } from './dto/update-caregiver-profile.dto';
import { CaregiverProfileRepository } from './repositories/caregiver-profile.repository';
import { AddressService } from '../address/address.service';
import { CaregiverProfile } from './entities/caregiver-profile.entity';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { calculateDistance } from 'src/shared/utils/location.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/bookings.enums';

@Injectable()
export class CaregiverProfileService {
  private readonly logTag = ServiceTags.CAREGIVER_PROFILE_SERVICE;

  constructor(
    private readonly caregiverProfileRepository: CaregiverProfileRepository,
    private readonly userService: UserService,
    private readonly addressService: AddressService,
    @Inject('ILogger') private readonly logger: ILogger,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Transform availability format to availability slots format
   */
  private transformAvailabilityToSlots(
    availability: AvailabilityDto,
    caregiverId?: string,
  ): Partial<AvailabilitySlot>[] {
    if (!availability?.availabilityByDay) return [];

    const timeSlotMap = {
      MORNING: { start: '06:00', end: '12:00', slot: 'mornings' },
      AFTERNOON: { start: '12:00', end: '18:00', slot: 'afternoons' },
      EVENING: { start: '18:00', end: '22:00', slot: 'evenings' },
      OVERNIGHT: { start: '22:00', end: '06:00', slot: 'overnight' },
    };

    const min = availability.expectedMinRate ?? null;
    const max = availability.expectedMaxRate ?? null;
    const vary = availability.scheduleMayVary ?? false;

    const slotGroups = new Map<string, number[]>();

    Object.entries(availability.availabilityByDay).forEach(
      ([day, timeSlots]) => {
        const dayNum = Number(day);
        const slotsArray = (timeSlots as string[]) ?? [];
        if (!slotsArray.length) return;

        const key = [...slotsArray]
          .map((s) => s.toUpperCase())
          .sort()
          .join(',');
        slotGroups.set(key, [...(slotGroups.get(key) ?? []), dayNum]);
      },
    );

    const slots: any[] = [];

    slotGroups.forEach((days, key) => {
      key.split(',').forEach((slotName) => {
        const info = timeSlotMap[slotName.toUpperCase()];
        if (!info) return;

        slots.push({
          ...(caregiverId ? { caregiverId } : {}),
          daysOfWeek: [...days].sort(),
          timeSlots: [info.slot],
          startTime: info.start,
          endTime: info.end,
          scheduleMayVary: vary,
          expectedMinRate: min,
          expectedMaxRate: max,
          isActive: true,
        });
      });
    });

    return slots;
  }

  async create(
    createCaregiverProfileDto: CreateCaregiverProfileDto,
  ): Promise<ResponseCaregiverProfileDto> {
    try {
      const {
        userId,
        phoneNumber,
        dateOfBirth,
        nid,
        address: addressData,
        verified,
        bio,
        yearsOfExperience,
        baseHourlyRate,
        serviceArea,
        radius,
        specializations,
        languageSpoken,
        profilePictureUrl,
        certificates,
        availabilitySlots,
        availability,
      } = createCaregiverProfileDto;

      const user = await this.userService.findEntityById(userId);
      if (!user) {
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      const existingProfile =
        await this.caregiverProfileRepository.findByUserId(userId);
      if (existingProfile) {
        throw new ConflictException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_ALREADY_EXISTS,
        );
      }

      if (createCaregiverProfileDto.firstName) {
        user.firstName = createCaregiverProfileDto.firstName;
      }
      if (createCaregiverProfileDto.lastName) {
        user.lastName = createCaregiverProfileDto.lastName;
      }
      if (createCaregiverProfileDto.gender) {
        user.gender = createCaregiverProfileDto.gender;
      }
      await this.caregiverProfileRepository.saveUser(user);

      let addressId: string | null = null;
      if (addressData) {
        const createdAddress = await this.addressService.create(
          userId,
          addressData,
        );
        addressId = createdAddress.id;
      }

      const profileData: Partial<CaregiverProfile> = {
        user,
        phoneNumber: phoneNumber?.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nid: nid?.trim() || undefined,
        addressId: addressId || undefined,
        verified: verified ?? false,
        bio: bio?.trim() || undefined,
        baseHourlyRate: baseHourlyRate ?? 0,
        serviceArea: serviceArea?.trim() || undefined,
        radius: radius ?? undefined,
        yearsOfExperience: yearsOfExperience ?? undefined,
        specializations: specializations || [],
        languageSpoken: languageSpoken || [],
        profilePictureUrl: profilePictureUrl?.trim() || undefined,
      };

      if (certificates && certificates.length > 0) {
        profileData.certificates = certificates.map((cert) => ({
          title: cert.title.trim(),
          institution: cert.institution?.trim() || null,
          yearOfCompletion: cert.yearOfCompletion?.trim() || null,
          certificateUrl: cert.certificateUrl,
          certificateKey: cert.certificateKey,
        })) as any; // TypeORM cascade will handle entity creation
      }

      let slotsToAdd: any[] = [];

      if (availability) {
        slotsToAdd = this.transformAvailabilityToSlots(availability);
      } else if (availabilitySlots && availabilitySlots.length > 0) {
        slotsToAdd = availabilitySlots.map((slot) => ({
          daysOfWeek: slot.daysOfWeek,
          timeSlots: slot.timeSlots || null,
          startTime: slot.startTime,
          endTime: slot.endTime,
          scheduleMayVary: slot.scheduleMayVary ?? false,
          expectedMinRate: slot.expectedMinRate ?? 0,
          expectedMaxRate: slot.expectedMaxRate ?? 0,
          isActive: true,
        })) as any;
      }

      if (slotsToAdd.length > 0) {
        profileData.availabilitySlots = slotsToAdd;
      }

      const savedProfile =
        await this.caregiverProfileRepository.createProfile(profileData);

      const result = await this.caregiverProfileRepository.findById(
        savedProfile.id,
      );

      const availabilityTransform = this.transformSlotsToAvailability(
        result?.availabilitySlots || [],
      );

      const caregiverProfileData = {
        ...result,
        availability: availabilityTransform,
      };

      return plainToInstance(
        ResponseCaregiverProfileDto,
        caregiverProfileData,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        `${CaregiverProfileLoggerMessages.FAILED_TO_CREATE}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_CREATION_FAILED,
      );
    }
  }

  async findAll(queryDto: QueryCaregiverProfileDto) {
    try {
      const { data, total } =
        await this.caregiverProfileRepository.findAll(queryDto);

      const profileIds = data.map((profile) => profile.id);
      const reviewStatsMap =
        await this.caregiverProfileRepository.getBatchReviewStats(profileIds);

      const profilesWithStats = data.map((profile) => {
        const stats = reviewStatsMap.get(profile.id) || {
          averageRating: 0,
          totalReviews: 0,
        };

        const availability = this.transformSlotsToAvailability(
          profile.availabilitySlots || [],
        );

        return {
          ...profile,
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          availability,
        };
      });

      const sanitizedData = plainToInstance(
        ResponseCaregiverProfileDto,
        profilesWithStats,
        {
          excludeExtraneousValues: true,
        },
      );

      return {
        data: sanitizedData,
        total,
        page: queryDto.page ?? 1,
        limit: queryDto.limit ?? 10,
      };
    } catch {
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }
  }

  async findOne(id: string): Promise<ResponseCaregiverProfileDto> {
    try {
      const profile = await this.caregiverProfileRepository.findById(id);

      if (!profile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      const reviewStats =
        await this.caregiverProfileRepository.getReviewStats(id);

      const availability = this.transformSlotsToAvailability(
        profile.availabilitySlots || [],
      );

      const profileData = {
        ...profile,
        averageRating: reviewStats.averageRating,
        totalReviews: reviewStats.totalReviews,
        availability,
      };

      return plainToInstance(ResponseCaregiverProfileDto, profileData, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }
  }

  async findByUserId(userId: string): Promise<ResponseCaregiverProfileDto> {
    try {
      const profile =
        await this.caregiverProfileRepository.findByUserId(userId);

      if (!profile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      const reviewStats = await this.caregiverProfileRepository.getReviewStats(
        profile.id,
      );

      const availability = this.transformSlotsToAvailability(
        profile.availabilitySlots || [],
      );

      const profileData = {
        ...profile,
        averageRating: reviewStats.averageRating,
        totalReviews: reviewStats.totalReviews,
        availability,
      };

      return plainToInstance(ResponseCaregiverProfileDto, profileData, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }
  }

  /**
   * Get this month's performance metrics for a caregiver by user ID.
   * Uses bookings for the caregiver profile and aggregated review stats.
   */
  async getMonthlyPerformanceForUser(userId: string): Promise<{
    servicesCompleted: number;
    totalHours: number;
    acceptanceRate: number;
    clientSatisfaction: number;
  }> {
    const profile = await this.caregiverProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(endOfMonth);

    const bookings = await this.bookingRepository.find({
      where: {
        caregiverId: profile.id,
        date: Between(startDate, endDate),
      },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETED,
    );

    const acceptedBookings = bookings.filter((b) =>
      [
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
      ].includes(b.status as BookingStatus),
    );

    const servicesCompleted = completedBookings.length;
    const totalHours = completedBookings.reduce(
      (sum, b) => sum + (b.duration || 0),
      0,
    );

    const acceptanceRate =
      totalBookings > 0
        ? Math.round((acceptedBookings.length / totalBookings) * 100)
        : 0;

    const reviewStats = await this.caregiverProfileRepository.getReviewStats(
      profile.id,
    );

    return {
      servicesCompleted,
      totalHours,
      acceptanceRate,
      clientSatisfaction: reviewStats.averageRating,
    };
  }

  async update(id: string, dto: UpdateCaregiverProfileDto) {
    try {
      const profile = await this.caregiverProfileRepository.findById(id);

      if (!profile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      const { address: addressData, ...restUpdates } = dto;

      let finalAddressId: string | null = profile.addressId || null;

      if (addressData && Object.keys(addressData).length > 0) {
        try {
          let targetAddress: any = null;

          if (addressData.id) {
            targetAddress = await this.addressService.findOne(
              addressData.id,
              profile.user.id,
            );
          }

          if (!targetAddress && profile.addressId) {
            targetAddress = await this.addressService.findOne(
              profile.addressId,
              profile.user.id,
            );
          }

          if (!targetAddress) {
            targetAddress = await this.addressService.findDefault(
              profile.user.id,
            );
          }

          if (targetAddress) {
            const hasAddressChanged =
              (addressData.streetAddress !== undefined &&
                addressData.streetAddress !== targetAddress.streetAddress) ||
              (addressData.apartment !== undefined &&
                addressData.apartment !== targetAddress.apartment) ||
              (addressData.city !== undefined &&
                addressData.city !== targetAddress.city) ||
              (addressData.state !== undefined &&
                addressData.state !== targetAddress.state) ||
              (addressData.postalCode !== undefined &&
                addressData.postalCode !== targetAddress.postalCode) ||
              (addressData.country !== undefined &&
                addressData.country !== targetAddress.country) ||
              (addressData.addressType !== undefined &&
                addressData.addressType !== targetAddress.addressType) ||
              (addressData.label !== undefined &&
                addressData.label !== targetAddress.label) ||
              (addressData.address !== undefined &&
                addressData.address !== targetAddress.address);

            if (hasAddressChanged) {
              this.logger.debug?.(
                this.logTag,
                CaregiverProfileLoggerMessages.UPDATING_ADDRESS,
                addressData,
              );
              await this.addressService.update(
                targetAddress.id,
                profile.user.id,
                addressData,
              );
            }
            finalAddressId = targetAddress.id;
          } else {
            this.logger.debug?.(
              this.logTag,
              'No target address found, creating new one',
            );
            const createdAddress = await this.addressService.create(
              profile.user.id,
              {
                streetAddress: '',
                city: '',
                state: '',
                postalCode: '',
                country: '',
                ...addressData,
                isDefault: true,
              },
            );
            finalAddressId = createdAddress.id;
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.debug?.(
              this.logTag,
              'Address not found during update, creating new one',
            );
            const createdAddress = await this.addressService.create(
              profile.user.id,
              {
                streetAddress: '',
                city: '',
                state: '',
                postalCode: '',
                country: '',
                ...addressData,
                isDefault: true,
              },
            );
            finalAddressId = createdAddress.id;
          } else {
            throw error;
          }
        }
      }

      if (dto.availability) {
        const patchByDay = dto.availability.availabilityByDay;

        if (patchByDay && Object.keys(patchByDay).length > 0) {
          // Get the days being updated
          const updatedDays = Object.keys(patchByDay).map(Number);

          // Keep existing slots for days NOT being updated
          const existingSlots = profile.availabilitySlots || [];
          const slotsToKeep = existingSlots.filter((slot) => {
            // Keep slots whose days are NOT in the update
            return !slot.daysOfWeek.some((day) => updatedDays.includes(day));
          });

          // Get rates from DTO or use defaults
          const min = dto.availability.expectedMinRate;
          const max = dto.availability.expectedMaxRate;
          const vary = dto.availability.scheduleMayVary;
          const shouldApplyRates =
            min !== undefined || max !== undefined || vary !== undefined;

          const updatedDaysAvailability: AvailabilityDto = {
            availabilityByDay: patchByDay,
            ...(shouldApplyRates
              ? {
                  expectedMinRate: min,
                  expectedMaxRate: max,
                  scheduleMayVary: vary,
                }
              : {}),
          } as any;

          let newSlots = this.transformAvailabilityToSlots(
            updatedDaysAvailability,
            profile.id,
          );

          if (!shouldApplyRates) {
            const oldIndex = new Map<string, AvailabilitySlot>();
            for (const s of existingSlots) {
              for (const d of s.daysOfWeek || []) {
                for (const ts of s.timeSlots || []) {
                  oldIndex.set(`${d}|${ts}`, s);
                }
              }
            }

            newSlots = newSlots.map((s) => {
              const d = s.daysOfWeek?.[0];
              const ts = s.timeSlots?.[0];
              const old = oldIndex.get(`${d}|${ts}`);

              return {
                ...s,
                expectedMinRate: old?.expectedMinRate ?? null,
                expectedMaxRate: old?.expectedMaxRate ?? null,
                scheduleMayVary: old?.scheduleMayVary ?? false,
              };
            });
          }

          for (const day of updatedDays) {
            await this.caregiverProfileRepository.deleteAvailabilitySlotsByDay(
              profile.id,
              day,
            );
          }

          const allSlots = [
            ...slotsToKeep.map((s) => ({
              caregiverId: profile.id,
              daysOfWeek: s.daysOfWeek,
              timeSlots: s.timeSlots,
              startTime: s.startTime,
              endTime: s.endTime,
              scheduleMayVary: s.scheduleMayVary,
              expectedMinRate: s.expectedMinRate,
              expectedMaxRate: s.expectedMaxRate,
              isActive: s.isActive,
            })),
            ...newSlots.map((s) => ({
              ...s,
              caregiverId: profile.id,
            })),
          ];

          profile.availabilitySlots =
            this.caregiverProfileRepository.createAvailabilitySlotEntities(
              allSlots,
            );
        }
      }

      const finalUpdates = { ...(restUpdates as any) };
      delete (finalUpdates as any).availability;

      if (
        finalUpdates.certificates &&
        Array.isArray(finalUpdates.certificates)
      ) {
        finalUpdates.certificates = finalUpdates.certificates.map(
          (cert: any) => ({
            ...cert,
            caregiverProfileId: profile.id,
            title: cert.title?.trim(),
            institution: cert.institution?.trim() || null,
            yearOfCompletion: cert.yearOfCompletion?.trim() || null,
          }),
        );
      }

      if (
        profile.user &&
        (finalUpdates.firstName || finalUpdates.lastName || finalUpdates.gender)
      ) {
        if (finalUpdates.firstName)
          profile.user.firstName = finalUpdates.firstName;
        if (finalUpdates.lastName)
          profile.user.lastName = finalUpdates.lastName;
        if (finalUpdates.gender) profile.user.gender = finalUpdates.gender;

        await this.caregiverProfileRepository.saveUser(profile.user);

        delete finalUpdates.firstName;
        delete finalUpdates.lastName;
        delete finalUpdates.gender;
      }

      Object.assign(profile, finalUpdates);

      if (finalAddressId !== profile.addressId) {
        this.logger.debug?.(
          this.logTag,
          CaregiverProfileLoggerMessages.UPDATING_ADDRESS_RELATION,
          {
            oldId: profile.addressId,
            newId: finalAddressId,
          },
        );
        profile.addressId = finalAddressId as string;
        profile.address = null as any;
      }

      const updated =
        await this.caregiverProfileRepository.updateProfile(profile);

      const reloadedProfile = await this.caregiverProfileRepository.findById(
        updated.id,
      );

      if (!reloadedProfile) {
        throw new InternalServerErrorException(
          'Failed to reload profile after update',
        );
      }

      const availability = this.transformSlotsToAvailability(
        reloadedProfile.availabilitySlots || [],
      );

      return plainToInstance(
        ResponseCaregiverProfileDto,
        { ...reloadedProfile, availability },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        this.logTag,
        CaregiverProfileLoggerMessages.FAILED_TO_UPDATE,
        {
          error: error.message,
          stack: error.stack,
          profileId: id,
        },
      );
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_UPDATE_FAILED,
      );
    }
  }

  async updateVerificationStatus(
    id: string,
    verified: boolean,
  ): Promise<ResponseCaregiverProfileDto> {
    try {
      const profile = await this.caregiverProfileRepository.findById(id);

      if (!profile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      profile.verified = verified;

      const updatedProfile =
        await this.caregiverProfileRepository.updateProfile(profile);

      return plainToInstance(ResponseCaregiverProfileDto, updatedProfile, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_UPDATE_FAILED,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const profile = await this.caregiverProfileRepository.findById(id);

      if (!profile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      await this.caregiverProfileRepository.removeProfile(profile);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        CaregiverProfileErrorMessages.CAREGIVER_PROFILE_DELETION_FAILED,
      );
    }
  }

  async findNearby(
    queryDto: QueryNearbyCaregiverProfileDto,
  ): Promise<ResponseCaregiverProfileDto[]> {
    try {
      const { lat, lng, radius = 10, ...filters } = queryDto;

      if (lat === undefined || lng === undefined) {
        throw new InternalServerErrorException(
          'Latitude and longitude are required for nearby search',
        );
      }

      const { data: allProfiles } =
        await this.caregiverProfileRepository.findAll({
          ...filters,
          page: 1,
          limit: 10000,
        });

      const nearbyProfiles = allProfiles.filter((profile) => {
        if (!profile.address?.coordinates) return false;

        const distance = calculateDistance(
          lat,
          lng,
          profile.address.coordinates.lat,
          profile.address.coordinates.lng,
        );

        return distance <= radius;
      });

      const page = filters.page ?? 1;
      const limit = filters.limit ?? 10;
      const skip = (page - 1) * limit;
      const paginatedProfiles = nearbyProfiles.slice(skip, skip + limit);

      const profileIds = paginatedProfiles.map((profile) => profile.id);
      const reviewStatsMap =
        await this.caregiverProfileRepository.getBatchReviewStats(profileIds);

      const profilesWithStats = paginatedProfiles.map((profile) => {
        const stats = reviewStatsMap.get(profile.id) || {
          averageRating: 0,
          totalReviews: 0,
        };

        const availability = this.transformSlotsToAvailability(
          profile.availabilitySlots || [],
        );

        return {
          ...profile,
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          availability,
        };
      });

      return plainToInstance(ResponseCaregiverProfileDto, profilesWithStats, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        `${CaregiverProfileLoggerMessages.FAILED_TO_FIND_NEARBY}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve nearby caregiver profiles',
      );
    }
  }

  private transformSlotsToAvailability(slots: any[]): any | null {
    if (!slots || slots.length === 0) {
      return null;
    }

    const TIME_SLOT_MAP = {
      mornings: 'MORNING',
      afternoons: 'AFTERNOON',
      evenings: 'EVENING',
      overnight: 'OVERNIGHT',
    };

    const availabilityByDay: Record<string, string[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };

    slots.forEach((slot) => {
      if (!slot.daysOfWeek || !slot.timeSlots) return;

      const normalizedTimeSlots = slot.timeSlots
        .map(
          (ts: string) => TIME_SLOT_MAP[ts.toLowerCase()] || ts.toUpperCase(),
        )
        .filter((ts: string) => ts);

      slot.daysOfWeek.forEach((day: number) => {
        if (day >= 0 && day <= 6) {
          const existingSlots = availabilityByDay[day.toString()] || [];
          availabilityByDay[day.toString()] = [
            ...new Set([...existingSlots, ...normalizedTimeSlots]),
          ];
        }
      });
    });

    const timeSlotOrder = {
      MORNING: 1,
      AFTERNOON: 2,
      EVENING: 3,
      OVERNIGHT: 4,
    };

    Object.keys(availabilityByDay).forEach((day) => {
      availabilityByDay[day] = availabilityByDay[day].sort(
        (a, b) => (timeSlotOrder[a] || 999) - (timeSlotOrder[b] || 999),
      );
    });

    return {
      availabilityByDay,
    };
  }
}
