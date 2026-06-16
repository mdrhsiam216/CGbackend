// src/address/address.service.ts
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ServiceTags } from 'src/common/enums/logging-tag.enum';
import { AddressErrorMessages, AddressLogMessages } from 'src/shared/enums';
import type { ILogger } from 'src/shared/interfaces/logger.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { AddressRepository } from './repositories/address.repository';

@Injectable()
export class AddressService {
  private readonly logTag = ServiceTags.ADDRESS_SERVICE;

  constructor(
    private readonly addressRepository: AddressRepository,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    this.logger.log(this.logTag, AddressLogMessages.ADDRESS_CREATION_STARTED, {
      userId,
      addressLabel: dto.label,
    });

    try {
      const address = await this.addressRepository.createAddress(userId, dto);

      this.logger.log(this.logTag, AddressLogMessages.ADDRESS_CREATED_SUCCESS, {
        userId,
        addressId: address.id,
      });

      return address;
    } catch (error) {
      this.logger.error(
        this.logTag,
        AddressLogMessages.ADDRESS_CREATION_ERROR,
        { userId, error: error.message, stack: error.stack },
      );

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_CREATION_FAILED,
      );
    }
  }

  async findAll(userId: string): Promise<Address[]> {
    this.logger.log(this.logTag, AddressLogMessages.ADDRESS_FETCH_ALL_STARTED, {
      userId,
    });

    try {
      const addresses = await this.addressRepository.findByUserId(userId);

      this.logger.log(
        this.logTag,
        AddressLogMessages.ADDRESS_FETCH_ALL_SUCCESS,
        { userId, count: addresses.length },
      );

      return addresses;
    } catch (error) {
      this.logger.error(this.logTag, AddressLogMessages.ADDRESS_FETCH_ERROR, {
        userId,
        error: error.message,
      });

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_FETCH_FAILED,
      );
    }
  }

  async findOne(id: string, userId: string): Promise<Address> {
    this.logger.log(this.logTag, AddressLogMessages.ADDRESS_FETCH_STARTED, {
      addressId: id,
      userId,
    });

    try {
      const address = await this.addressRepository.findByIdAndUserId(
        id,
        userId,
      );

      if (!address) {
        this.logger.warn(
          this.logTag,
          AddressLogMessages.ADDRESS_NOT_FOUND_WARNING,
          { addressId: id, userId },
        );

        throw new NotFoundException(AddressErrorMessages.ADDRESS_NOT_FOUND);
      }

      this.logger.log(this.logTag, AddressLogMessages.ADDRESS_FETCH_SUCCESS, {
        addressId: id,
        userId,
      });

      return address;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(this.logTag, AddressLogMessages.ADDRESS_FETCH_ERROR, {
        addressId: id,
        userId,
        error: error.message,
      });

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_FETCH_FAILED,
      );
    }
  }

  async findDefault(userId: string): Promise<Address | null> {
    this.logger.log(
      this.logTag,
      AddressLogMessages.DEFAULT_ADDRESS_FETCH_STARTED,
      { userId },
    );

    try {
      const defaultAddress =
        await this.addressRepository.findDefaultByUserId(userId);

      if (!defaultAddress) {
        this.logger.warn(
          this.logTag,
          AddressLogMessages.DEFAULT_ADDRESS_NOT_FOUND_WARNING,
          { userId },
        );

        throw new NotFoundException(
          AddressErrorMessages.DEFAULT_ADDRESS_NOT_FOUND,
        );
      }

      this.logger.log(
        this.logTag,
        AddressLogMessages.DEFAULT_ADDRESS_FETCH_SUCCESS,
        { userId, addressId: defaultAddress.id },
      );

      return defaultAddress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(this.logTag, AddressLogMessages.ADDRESS_FETCH_ERROR, {
        userId,
        error: error.message,
      });

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_FETCH_FAILED,
      );
    }
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    this.logger.log(this.logTag, AddressLogMessages.ADDRESS_UPDATE_STARTED, {
      addressId: id,
      userId,
    });

    try {
      const updatedAddress = await this.addressRepository.updateAddress(
        id,
        userId,
        dto,
      );

      if (!updatedAddress) {
        this.logger.warn(
          this.logTag,
          AddressLogMessages.ADDRESS_NOT_FOUND_WARNING,
          { addressId: id, userId },
        );

        throw new NotFoundException(AddressErrorMessages.ADDRESS_NOT_FOUND);
      }

      this.logger.log(this.logTag, AddressLogMessages.ADDRESS_UPDATE_SUCCESS, {
        addressId: id,
        userId,
      });

      return updatedAddress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(this.logTag, AddressLogMessages.ADDRESS_UPDATE_ERROR, {
        addressId: id,
        userId,
        error: error.message,
      });

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_UPDATE_FAILED,
      );
    }
  }

  async setDefault(userId: string, addressId: string): Promise<Address> {
    this.logger.log(
      this.logTag,
      AddressLogMessages.SET_DEFAULT_ADDRESS_STARTED,
      { addressId, userId },
    );

    try {
      const updatedDefault = await this.addressRepository.setDefaultAddress(
        addressId,
        userId,
      );

      if (!updatedDefault) {
        this.logger.warn(
          this.logTag,
          AddressLogMessages.ADDRESS_NOT_FOUND_WARNING,
          { addressId, userId },
        );

        throw new NotFoundException(AddressErrorMessages.ADDRESS_NOT_FOUND);
      }

      this.logger.log(
        this.logTag,
        AddressLogMessages.SET_DEFAULT_ADDRESS_SUCCESS,
        { addressId, userId },
      );

      return updatedDefault;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        this.logTag,
        AddressLogMessages.SET_DEFAULT_ADDRESS_ERROR,
        { addressId, userId, error: error.message },
      );

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_UPDATE_FAILED,
      );
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(this.logTag, AddressLogMessages.ADDRESS_DELETION_STARTED, {
      addressId: id,
      userId,
    });

    try {
      const address = await this.addressRepository.findByIdAndUserId(
        id,
        userId,
      );

      if (!address) {
        this.logger.warn(
          this.logTag,
          AddressLogMessages.ADDRESS_NOT_FOUND_WARNING,
          { addressId: id, userId },
        );

        throw new NotFoundException(AddressErrorMessages.ADDRESS_NOT_FOUND);
      }

      await this.addressRepository.deleteAddressByUser(id, userId);

      this.logger.log(
        this.logTag,
        AddressLogMessages.ADDRESS_DELETION_SUCCESS,
        { addressId: id, userId },
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        this.logTag,
        AddressLogMessages.ADDRESS_DELETION_ERROR,
        { addressId: id, userId, error: error.message },
      );

      throw new InternalServerErrorException(
        AddressErrorMessages.ADDRESS_DELETION_FAILED,
      );
    }
  }
}
