import { PartialType } from '@nestjs/swagger';
import { CreateAvailabilitySlotDto } from './create-availability-slot.dto';

export class UpdateAvailabilitySlotDto extends PartialType(
  CreateAvailabilitySlotDto,
) {
  startTime?: string[];
  endTime?: string[];
}
