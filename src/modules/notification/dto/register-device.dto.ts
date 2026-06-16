import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DeviceType } from '../entities/user-device.entity';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @IsEnum(DeviceType)
  @IsNotEmpty()
  deviceType: DeviceType;
}
