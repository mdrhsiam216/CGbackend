import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ClientProfileErrorMessages,
  UserErrorMessages,
} from 'src/shared/enums';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import { CreateClientProfileDto } from '../client-profile/dto/create-client-profile.dto';
import { QueryClientProfileDto } from '../client-profile/dto/query-client-profile.dto';
import { ResponseClientProfileDto } from '../client-profile/dto/response-client-profile.dto';
import { UpdateClientProfileDto } from '../client-profile/dto/update-client-profile.dto';
import { ClientProfile } from '../client-profile/entities/client-profile.entity';
import { ClientProfileRepository } from '../client-profile/repositories/client-profile.repository';
import { UserService } from '../user/user.service';
import { AddressService } from '../address/address.service';
import { UserRepository } from '../user/repository/user.repository';
import type { ILogger } from '../../shared/interfaces/logger.interface';

@Injectable()
export class ClientProfileService {
  private readonly logTag = ServiceTags.CLIENT_PROFILE_SERVICE;

  constructor(
    private readonly clientProfileRepository: ClientProfileRepository,
    private readonly userService: UserService,
    private readonly addressService: AddressService,
    private readonly userRepository: UserRepository,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async create(
    createClientProfileDto: CreateClientProfileDto,
  ): Promise<ResponseClientProfileDto> {
    try {
      this.logger.log(this.logTag, 'Creating client profile', {
        userId: createClientProfileDto.userId,
      });

      const user = await this.userService.findEntityById(
        createClientProfileDto.userId,
      );
      if (!user) {
        this.logger.warn(
          this.logTag,
          'User not found during client profile creation',
          {
            userId: createClientProfileDto.userId,
          },
        );
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      this.logger.debug?.(
        this.logTag,
        'User found, checking for existing profile',
        { userId: user.id },
      );

      const existingProfile = await this.clientProfileRepository.findByUserId(
        createClientProfileDto.userId,
      );
      if (existingProfile) {
        this.logger.warn(this.logTag, 'Client profile already exists', {
          userId: createClientProfileDto.userId,
          existingProfileId: existingProfile.id,
        });
        throw new ConflictException(
          ClientProfileErrorMessages.CLIENT_PROFILE_ALREADY_EXISTS,
        );
      }

      const profileData: Partial<ClientProfile> = {
        user,
        dateOfBirth: new Date(createClientProfileDto.dateOfBirth),
      };

      const savedProfile =
        await this.clientProfileRepository.createProfile(profileData);
      this.logger.log(this.logTag, 'Client profile created successfully', {
        profileId: savedProfile.id,
        userId: createClientProfileDto.userId,
      });

      const result = await this.clientProfileRepository.findById(
        savedProfile.id,
      );

      return plainToInstance(ResponseClientProfileDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(
          this.logTag,
          'Client profile creation failed with known error',
          {
            error: error.message,
            userId: createClientProfileDto.userId,
          },
        );
        throw error;
      }

      this.logger.error(
        this.logTag,
        'Unexpected error during client profile creation',
        {
          error: error.message,
          stack: error.stack,
          userId: createClientProfileDto.userId,
        },
      );

      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_CREATION_FAILED,
      );
    }
  }

  async findAll(queryDto: QueryClientProfileDto) {
    try {
      this.logger.log(this.logTag, 'Fetching all client profiles', {
        page: queryDto.page ?? 1,
        limit: queryDto.limit ?? 10,
      });

      const { data, total } =
        await this.clientProfileRepository.findAll(queryDto);

      this.logger.log(this.logTag, 'Client profiles retrieved successfully', {
        total,
        returned: data.length,
      });

      const sanitizedData = plainToInstance(ResponseClientProfileDto, data, {
        excludeExtraneousValues: true,
      });

      return {
        data: sanitizedData,
        total,
        page: queryDto.page ?? 1,
        limit: queryDto.limit ?? 10,
      };
    } catch (error) {
      this.logger.error(this.logTag, 'Error fetching client profiles', {
        error: error.message,
        query: queryDto,
      });
      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
      );
    }
  }

  async findOne(id: string): Promise<ResponseClientProfileDto> {
    try {
      this.logger.log(this.logTag, 'Finding client profile by ID', {
        profileId: id,
      });

      const profile = await this.clientProfileRepository.findById(id);
      if (!profile) {
        this.logger.warn(this.logTag, 'Client profile not found', {
          profileId: id,
        });
        throw new NotFoundException(
          ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
        );
      }

      this.logger.log(this.logTag, 'Client profile found successfully', {
        profileId: id,
      });
      return plainToInstance(ResponseClientProfileDto, profile, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(this.logTag, 'Error finding client profile', {
        error: error.message,
        profileId: id,
      });
      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
      );
    }
  }

  async findByUserId(userId: string): Promise<ResponseClientProfileDto> {
    try {
      const profile = await this.clientProfileRepository.findByUserId(userId);
      if (!profile)
        throw new NotFoundException(
          ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
        );

      return plainToInstance(ResponseClientProfileDto, profile, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
      );
    }
  }

  async update(
    id: string,
    updateClientProfileDto: UpdateClientProfileDto,
  ): Promise<ResponseClientProfileDto> {
    try {
      this.logger.log(this.logTag, 'Updating client profile', {
        profileId: id,
        updateFields: Object.keys(updateClientProfileDto),
      });

      const profile = await this.clientProfileRepository.findById(id);
      if (!profile) {
        this.logger.warn(this.logTag, 'Client profile not found for update', {
          profileId: id,
        });
        throw new NotFoundException(
          ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
        );
      }

      const {
        firstName,
        lastName,
        gender,
        phone,
        avatarUrl,
        dateOfBirth,
        emergencyContacts,
        address,
      } = updateClientProfileDto;

      let userUpdated = false;
      const userFieldsToUpdate: any = {};

      if (firstName !== undefined && firstName !== profile.user.firstName) {
        userFieldsToUpdate.firstName = firstName;
        userUpdated = true;
      }
      if (lastName !== undefined && lastName !== profile.user.lastName) {
        userFieldsToUpdate.lastName = lastName;
        userUpdated = true;
      }
      if (gender !== undefined && gender !== profile.user.gender) {
        userFieldsToUpdate.gender = gender;
        userUpdated = true;
      }
      if (phone !== undefined && phone !== profile.user.phone) {
        userFieldsToUpdate.phone = phone;
        userUpdated = true;
      }
      if (avatarUrl !== undefined && avatarUrl !== profile.user.avatarUrl) {
        userFieldsToUpdate.avatarUrl = avatarUrl;
        userUpdated = true;
      }

      if (emergencyContacts !== undefined) {
        const currentContacts = profile.user.emergencyContacts || {};
        const hasPrimaryChanged =
          emergencyContacts.primary &&
          (emergencyContacts.primary.name !== currentContacts.primary?.name ||
            emergencyContacts.primary.phone !==
              currentContacts.primary?.phone ||
            emergencyContacts.primary.relationship !==
              currentContacts.primary?.relationship);

        const hasSecondaryChanged =
          emergencyContacts.secondary &&
          (emergencyContacts.secondary.name !==
            currentContacts.secondary?.name ||
            emergencyContacts.secondary.phone !==
              currentContacts.secondary?.phone ||
            emergencyContacts.secondary.relationship !==
              currentContacts.secondary?.relationship);

        if (hasPrimaryChanged || hasSecondaryChanged) {
          userFieldsToUpdate.emergencyContacts = emergencyContacts;
          userUpdated = true;
        }
      }

      if (userUpdated) {
        this.logger.debug?.(
          this.logTag,
          'Updating user fields',
          userFieldsToUpdate,
        );
        Object.assign(profile.user, userFieldsToUpdate);
        await this.userRepository.update(profile.user);
      }

      // Update ClientProfile fields (dateOfBirth)
      if (dateOfBirth !== undefined) {
        const newBirthDate = new Date(dateOfBirth);
        const currentBirthDate = new Date(profile.dateOfBirth);

        if (newBirthDate.getTime() !== currentBirthDate.getTime()) {
          profile.dateOfBirth = newBirthDate as any;
          await this.clientProfileRepository.updateProfile(profile);
        }
      }

      // Update or create Address
      if (address && Object.keys(address).length > 0) {
        try {
          let targetAddress: any = null;

          if (address.id) {
            targetAddress = await this.addressService.findOne(
              address.id,
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
              (address.streetAddress !== undefined &&
                address.streetAddress !== targetAddress.streetAddress) ||
              (address.apartment !== undefined &&
                address.apartment !== targetAddress.apartment) ||
              (address.city !== undefined &&
                address.city !== targetAddress.city) ||
              (address.state !== undefined &&
                address.state !== targetAddress.state) ||
              (address.postalCode !== undefined &&
                address.postalCode !== targetAddress.postalCode) ||
              (address.country !== undefined &&
                address.country !== targetAddress.country) ||
              (address.address !== undefined &&
                address.address !== targetAddress.address) ||
              (address.addressType !== undefined &&
                address.addressType !== targetAddress.addressType) ||
              (address.label !== undefined &&
                address.label !== targetAddress.label) ||
              (address.coordinates !== undefined &&
                (address.coordinates.lat !== targetAddress.coordinates?.lat ||
                  address.coordinates.lng !== targetAddress.coordinates?.lng));

            if (hasAddressChanged) {
              this.logger.debug?.(this.logTag, 'Updating address', address);
              await this.addressService.update(
                targetAddress.id,
                profile.user.id,
                address,
              );
            }
          } else {
            await this.addressService.create(profile.user.id, {
              streetAddress: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Bangladesh',
              ...address,
              isDefault: true,
            });
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            await this.addressService.create(profile.user.id, {
              streetAddress: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'Bangladesh',
              ...address,
              isDefault: true,
            });
          } else {
            throw error;
          }
        }
      }

      const updatedProfile = await this.clientProfileRepository.findById(id);

      this.logger.log(this.logTag, 'Client profile updated successfully', {
        profileId: id,
      });
      return plainToInstance(ResponseClientProfileDto, updatedProfile, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(this.logTag, 'Error updating client profile', {
        error: error.message,
        profileId: id,
        updateData: updateClientProfileDto,
      });
      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_UPDATE_FAILED,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(this.logTag, 'Removing client profile', {
        profileId: id,
      });

      const profile = await this.clientProfileRepository.findById(id);
      if (!profile) {
        this.logger.warn(this.logTag, 'Client profile not found for removal', {
          profileId: id,
        });
        throw new NotFoundException(
          ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
        );
      }

      await this.clientProfileRepository.removeProfile(profile);
      this.logger.log(this.logTag, 'Client profile removed successfully', {
        profileId: id,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(this.logTag, 'Error removing client profile', {
        error: error.message,
        profileId: id,
      });
      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_DELETION_FAILED,
      );
    }
  }

  async getAge(id: string): Promise<{ age: number }> {
    try {
      const profile = await this.clientProfileRepository.findById(id);
      if (!profile)
        throw new NotFoundException(
          ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
        );

      const today = new Date();
      const birthDate = new Date(profile.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      )
        age--;

      return { age };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        ClientProfileErrorMessages.CLIENT_PROFILE_NOT_FOUND,
      );
    }
  }
}
