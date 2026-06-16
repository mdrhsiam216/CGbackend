import { Injectable } from '@nestjs/common';
import { DataSource, Not, Repository } from 'typeorm';
import { Address } from '../entities/address.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressRepository extends Repository<Address> {
  constructor(private readonly dataSource: DataSource) {
    super(Address, dataSource.createEntityManager());
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    const addressCount = await this.countUserAddresses(userId);
    const isDefault = dto.isDefault || addressCount === 0;

    if (isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const address = this.create({
      ...dto,
      userId,
      isDefault,
    });

    return await this.save(address);
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return await this.find({ where: { userId } });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Address | null> {
    return await this.findOne({ where: { id, userId } });
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    return await this.findOne({ where: { userId, isDefault: true } });
  }

  async countUserAddresses(userId: string): Promise<number> {
    return await this.count({ where: { userId } });
  }

  async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.update({ userId }, { isDefault: false });
  }

  async updateAddress(
    id: string,
    userId: string,
    dto: UpdateAddressDto,
  ): Promise<Address | null> {
    const address = await this.findByIdAndUserId(id, userId);
    if (!address) return null;

    if (dto.isDefault === true) {
      await this.unsetDefaultAddresses(userId);
    }

    if (dto.isDefault === false && address.isDefault) {
      const addressCount = await this.countUserAddresses(userId);
      if (addressCount === 1) {
        dto.isDefault = true;
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );

    Object.assign(address, updateData);
    return await this.save(address);
  }

  async setDefaultAddress(
    addressId: string,
    userId: string,
  ): Promise<Address | null> {
    const address = await this.findByIdAndUserId(addressId, userId);
    if (!address) return null;

    await this.unsetDefaultAddresses(userId);
    address.isDefault = true;
    return await this.save(address);
  }

  async deleteAddressByUser(id: string, userId: string): Promise<void> {
    const address = await this.findByIdAndUserId(id, userId);
    if (!address) return;

    // If deleting default, promote next one
    if (address.isDefault) {
      const count = await this.countUserAddresses(userId);
      if (count > 1) {
        const nextAddress = await this.findOne({
          where: { userId, id: Not(id) },
        });
        if (nextAddress) {
          nextAddress.isDefault = true;
          await this.save(nextAddress);
        }
      }
    }

    await this.delete(id);
  }
}
