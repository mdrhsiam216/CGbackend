import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserDevice, DeviceType } from '../entities/user-device.entity';

@Injectable()
export class UserDeviceRepository {
  constructor(
    @InjectRepository(UserDevice)
    private readonly repository: Repository<UserDevice>,
  ) {}

  async findById(id: string): Promise<UserDevice | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<UserDevice[]> {
    return this.repository.find({
      where: { userId, isActive: true },
    });
  }

  async findByUserIds(userIds: string[]): Promise<UserDevice[]> {
    return this.repository.find({
      where: { userId: In(userIds), isActive: true },
    });
  }

  async findByDeviceToken(deviceToken: string): Promise<UserDevice | null> {
    return this.repository.findOne({ where: { deviceToken } });
  }

  async findByUserIdAndToken(
    userId: string,
    deviceToken: string,
  ): Promise<UserDevice | null> {
    return this.repository.findOne({
      where: { userId, deviceToken },
    });
  }

  async create(data: {
    userId: string;
    deviceToken: string;
    deviceType: DeviceType;
  }): Promise<UserDevice> {
    const device = this.repository.create(data);
    return this.repository.save(device);
  }

  async update(device: UserDevice): Promise<UserDevice> {
    return this.repository.save(device);
  }

  async upsertDevice(data: {
    userId: string;
    deviceToken: string;
    deviceType: DeviceType;
  }): Promise<UserDevice> {
    // Check if device with this token already exists
    const existingDevice = await this.findByDeviceToken(data.deviceToken);

    if (existingDevice) {
      // Update existing device - may have changed user or type
      existingDevice.userId = data.userId;
      existingDevice.deviceType = data.deviceType;
      existingDevice.isActive = true;
      return this.repository.save(existingDevice);
    }

    // Create new device
    return this.create(data);
  }

  async deactivateDevice(deviceToken: string): Promise<void> {
    await this.repository.update({ deviceToken }, { isActive: false });
  }

  async deactivateAllUserDevices(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isActive: false });
  }

  async deleteByDeviceToken(deviceToken: string): Promise<void> {
    await this.repository.delete({ deviceToken });
  }

  async getActiveDeviceTokensByUserId(userId: string): Promise<string[]> {
    const devices = await this.findByUserId(userId);
    return devices.map((device) => device.deviceToken);
  }

  async getActiveDeviceTokensByUserIds(userIds: string[]): Promise<string[]> {
    const devices = await this.findByUserIds(userIds);
    return devices.map((device) => device.deviceToken);
  }
}
