import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QueryAvailabilitySlotDto } from '../dto/query-availability-slot-dto';
import { AvailabilitySlot } from '../entities/availability-slot.entity';

@Injectable()
export class AvailabilitySlotRepository {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly repository: Repository<AvailabilitySlot>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<AvailabilitySlot | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['caregiver', 'caregiver.user'],
    });
  }

  async findByCaregiverId(caregiverId: string): Promise<AvailabilitySlot[]> {
    return this.repository.find({
      where: { caregiverId },
      relations: ['caregiver', 'caregiver.user'],
      order: { startTime: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAll(
    queryDto: QueryAvailabilitySlotDto,
  ): Promise<{ data: AvailabilitySlot[]; total: number }> {
    const {
      caregiverId,
      daysOfWeek,
      timeSlots,
      isActive,
      scheduleMayVary,
      page = 1,
      limit = 10,
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.caregiver', 'caregiver')
      .leftJoinAndSelect('caregiver.user', 'user');

    if (caregiverId) {
      queryBuilder.andWhere('slot.caregiverId = :caregiverId', { caregiverId });
    }

    if (daysOfWeek && daysOfWeek.length > 0) {
      queryBuilder.andWhere('slot.daysOfWeek && :daysOfWeek', {
        daysOfWeek: JSON.stringify(daysOfWeek),
      });
    }

    if (timeSlots && timeSlots.length > 0) {
      queryBuilder.andWhere('slot.timeSlots && :timeSlots', {
        timeSlots: JSON.stringify(timeSlots),
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('slot.isActive = :isActive', { isActive });
    }

    if (scheduleMayVary !== undefined) {
      queryBuilder.andWhere('slot.scheduleMayVary = :scheduleMayVary', {
        scheduleMayVary,
      });
    }

    queryBuilder.orderBy('slot.startTime', 'ASC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findAvailableSlots(
    caregiverId: string,
    daysOfWeek?: number[],
    timeSlots?: string[],
  ): Promise<AvailabilitySlot[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.caregiver', 'caregiver')
      .leftJoinAndSelect('caregiver.user', 'user')
      .where('slot.caregiverId = :caregiverId', { caregiverId })
      .andWhere('slot.isActive = :isActive', { isActive: true });

    if (daysOfWeek && daysOfWeek.length > 0) {
      queryBuilder.andWhere('slot.daysOfWeek && :daysOfWeek', {
        daysOfWeek: JSON.stringify(daysOfWeek),
      });
    }

    if (timeSlots && timeSlots.length > 0) {
      queryBuilder.andWhere('slot.timeSlots && :timeSlots', {
        timeSlots: JSON.stringify(timeSlots),
      });
    }

    return queryBuilder.orderBy('slot.startTime', 'ASC').getMany();
  }

  async findActiveByCaregiver(
    caregiverId: string,
  ): Promise<AvailabilitySlot[]> {
    return this.repository.find({
      where: {
        caregiverId,
        isActive: true,
      },
      relations: ['caregiver', 'caregiver.user'],
      order: { startTime: 'ASC' },
    });
  }

  async findByTimeRange(
    caregiverId: string,
    startTime: string,
    endTime: string,
  ): Promise<AvailabilitySlot[]> {
    return this.repository
      .createQueryBuilder('slot')
      .where('slot.caregiverId = :caregiverId', { caregiverId })
      .andWhere('slot.startTime <= :endTime', { endTime })
      .andWhere('slot.endTime >= :startTime', { startTime })
      .getMany();
  }

  async findByDaysOfWeek(
    caregiverId: string,
    daysOfWeek: number[],
  ): Promise<AvailabilitySlot[]> {
    return this.repository
      .createQueryBuilder('slot')
      .where('slot.caregiverId = :caregiverId', { caregiverId })
      .andWhere('slot.daysOfWeek && :daysOfWeek', {
        daysOfWeek: JSON.stringify(daysOfWeek),
      })
      .andWhere('slot.isActive = :isActive', { isActive: true })
      .getMany();
  }

  async findByTimeSlots(
    caregiverId: string,
    timeSlots: string[],
  ): Promise<AvailabilitySlot[]> {
    return this.repository
      .createQueryBuilder('slot')
      .where('slot.caregiverId = :caregiverId', { caregiverId })
      .andWhere('slot.timeSlots && :timeSlots', {
        timeSlots: JSON.stringify(timeSlots),
      })
      .andWhere('slot.isActive = :isActive', { isActive: true })
      .getMany();
  }

  async createSlot(
    slotData: Partial<AvailabilitySlot>,
  ): Promise<AvailabilitySlot> {
    const slot = this.repository.create(slotData);
    return this.repository.save(slot);
  }

  async update(slot: AvailabilitySlot): Promise<AvailabilitySlot> {
    return this.repository.save(slot);
  }

  async remove(slot: AvailabilitySlot): Promise<void> {
    await this.repository.remove(slot);
  }

  async removeByCaregiverId(caregiverId: string): Promise<void> {
    await this.repository.delete({ caregiverId });
  }

  async deactivateSlotsByCaregiver(caregiverId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(AvailabilitySlot)
      .set({ isActive: false })
      .where('caregiverId = :caregiverId', { caregiverId })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();
  }

  async countActiveSlotsByCaregiver(caregiverId: string): Promise<number> {
    return this.repository.count({
      where: {
        caregiverId,
        isActive: true,
      },
    });
  }

  async findWithScheduleVariation(
    caregiverId: string,
  ): Promise<AvailabilitySlot[]> {
    return this.repository.find({
      where: {
        caregiverId,
        scheduleMayVary: true,
        isActive: true,
      },
      relations: ['caregiver', 'caregiver.user'],
      order: { startTime: 'ASC' },
    });
  }
}
