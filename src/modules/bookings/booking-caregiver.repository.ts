import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository, Not, IsNull, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingErrorMessages } from 'src/shared/enums';
import { BookingValidationMessage } from './enums';
import { BookingStatus } from './enums';
import { CaregiverProfile } from '../caregiver-profile/entities/caregiver-profile.entity';
import { User } from '../user/entities/user.entity';
import { IBookingRepository } from './interfaces/booking.interfaces';

@Injectable()
export class BookingRepository implements IBookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  async createBookingWithQueryRunner(
    queryRunner: QueryRunner,
    bookingData: Partial<Booking>,
  ): Promise<Booking> {
    const booking = queryRunner.manager.create(Booking, bookingData);
    return queryRunner.manager.save(booking);
  }

  async findBookingById(bookingId: string): Promise<Booking | null> {
    return this.repository.findOne({
      where: { id: bookingId },
      relations: ['user', 'caregiver', 'caregiver.user', 'address'],
    });
  }

  async validateCaregiverExists(
    queryRunner: QueryRunner,
    caregiverId: string,
  ): Promise<CaregiverProfile> {
    const caregiver = await queryRunner.manager.findOne(CaregiverProfile, {
      where: { id: caregiverId },
    });
    if (!caregiver) {
      throw new NotFoundException(BookingValidationMessage.CAREGIVER_NOT_FOUND);
    }
    return caregiver;
  }

  async validateUserExists(
    queryRunner: QueryRunner,
    userId: string,
  ): Promise<User> {
    const user = await queryRunner.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(BookingValidationMessage.USER_NOT_FOUND);
    }
    return user;
  }

  async updateBookingStatus(
    queryRunner: QueryRunner,
    bookingId: string,
    userId: string,
  ): Promise<Booking | null> {
    const updateResult = await queryRunner.manager.update(
      Booking,
      {
        id: bookingId,
        userId: userId,
      },
      {
        status: BookingStatus.CANCELLED,
        canceledAt: new Date(),
      },
    );

    if (updateResult.affected === 0) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    return await queryRunner.manager.findOne(Booking, {
      where: { id: bookingId },
      relations: ['user', 'caregiver', 'caregiver.user', 'address'],
    });
  }

  async softDeleteBooking(
    queryRunner: QueryRunner,
    bookingId: string,
  ): Promise<Booking | null> {
    const updateResult = await queryRunner.manager.softDelete(Booking, {
      id: bookingId,
    });

    if (updateResult.affected === 0) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    return await queryRunner.manager.findOne(Booking, {
      where: { id: bookingId },
      withDeleted: true,
      relations: ['user', 'caregiver', 'caregiver.user', 'address'],
    });
  }

  async findAllBookings(
    userId?: string,
    caregiverId?: string,
    status?: string[],
    page: number = 1,
    limit: number = 10,
  ): Promise<{ bookings: Booking[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.repository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.caregiver', 'caregiver')
      .leftJoinAndSelect('caregiver.user', 'caregiverUser')
      .leftJoinAndSelect('booking.address', 'address')
      .orderBy('booking.date', 'DESC')
      .addOrderBy('booking.startTime', 'DESC')
      .skip(skip)
      .take(limit);

    if (userId) {
      queryBuilder.andWhere('booking.userId = :userId', { userId });
    }

    if (caregiverId) {
      queryBuilder.andWhere('booking.caregiverId = :caregiverId', {
        caregiverId,
      });
    }

    if (status && status.length > 0) {
      if (status.includes(BookingStatus.CONFIRMED)) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        queryBuilder.andWhere(
          '(booking.status IN (:...status) AND (booking.status != :confirmedStatus OR (booking.date > :currentDate OR (booking.date = :currentDate AND booking.startTime >= :currentTime))))',
          {
            status,
            confirmedStatus: BookingStatus.CONFIRMED,
            currentDate,
            currentTime,
          },
        );
      } else {
        queryBuilder.andWhere('booking.status IN (:...status)', { status });
      }
    }

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return { bookings, total };
  }

  async findAll(): Promise<Booking[]> {
    return await this.repository.find({
      where: {},
      relations: ['user', 'caregiver', 'caregiver.user', 'address'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCaregiverId(
    caregiverId: string,
    status?: BookingStatus[],
  ): Promise<Booking[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.caregiver', 'caregiver')
      .leftJoinAndSelect('caregiver.user', 'caregiverUser')
      .where('booking.caregiverId = :caregiverId', { caregiverId });

    if (status && status.length > 0) {
      if (status.includes(BookingStatus.CONFIRMED)) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        queryBuilder.andWhere(
          '(booking.status IN (:...status) AND (booking.status != :confirmedStatus OR (booking.date > :currentDate OR (booking.date = :currentDate AND booking.startTime >= :currentTime))))',
          {
            status,
            confirmedStatus: BookingStatus.CONFIRMED,
            currentDate,
            currentTime,
          },
        );
      } else {
        queryBuilder.andWhere('booking.status IN (:...status)', { status });
      }
    }

    return queryBuilder
      .orderBy('booking.date', 'DESC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany();
  }

  async findBookingsByUserId(userId: string): Promise<Booking[]> {
    return this.repository.find({
      where: { userId },
      relations: ['caregiver', 'caregiver.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveBookingsByCaregiverId(
    caregiverId: string,
  ): Promise<Booking[]> {
    return this.repository.find({
      where: {
        caregiverId,
        status: 'confirmed',
      },
      relations: ['user'],
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async save(booking: Booking): Promise<Booking> {
    return this.repository.save(booking);
  }

  async findActiveClockedInBookings(
    id: string,
    type: 'client' | 'caregiver',
    bookingId?: string,
  ): Promise<Booking[]> {
    const whereCondition: any = {
      clockInTime: Not(IsNull()),
      clockOutTime: IsNull(),
    };

    if (type === 'client') {
      whereCondition.userId = id;
    } else {
      whereCondition.caregiverId = id;
    }

    if (bookingId) {
      whereCondition.id = bookingId;
    }

    return this.repository.find({
      where: whereCondition,
      relations: ['user', 'caregiver', 'caregiver.user'],
      order: {
        clockInTime: 'DESC',
      },
    });
  }

  async findOverlappingBookings(
    caregiverId: string,
    date: string,
    startTime: string,
    durationHours: number,
  ): Promise<Booking[]> {
    const bookings = await this.repository.find({
      where: {
        caregiverId,
        date,
      },
    });

    const activeBookings = bookings.filter(
      (b) => b.status !== BookingStatus.CANCELLED,
    );

    const [newStartH, newStartM] = startTime.split(':').map(Number);
    const newStartMinutes = newStartH * 60 + newStartM;
    const newEndMinutes = newStartMinutes + durationHours * 60;

    return activeBookings.filter((booking) => {
      const [bStartH, bStartM] = booking.startTime.split(':').map(Number);
      const bStartMinutes = bStartH * 60 + bStartM;
      const bEndMinutes = bStartMinutes + booking.duration * 60;

      return bStartMinutes < newEndMinutes && bEndMinutes > newStartMinutes;
    });
  }
}
