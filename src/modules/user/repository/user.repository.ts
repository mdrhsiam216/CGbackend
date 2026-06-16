import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { QueryUserDto } from '../dto/query-user-dto';
import { User } from '../entities/user.entity';
import { PaymentStatus } from '../../SSL_Commerce/enums/ssl-commerce.enums';
import { BookingStatus } from '../../bookings/enums/bookings.enums';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('user.clientProfile', 'clientProfile')
      .leftJoinAndSelect('user.caregiverProfile', 'caregiverProfile')
      .leftJoinAndSelect('user.addresses', 'address')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async findByEmailOrPhone(email: string, phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: [{ email }, { phone }],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone },
    });
  }

  async findAll(
    queryUserDto: QueryUserDto,
  ): Promise<{ data: User[]; total: number }> {
    const { search, status, page = 1, limit = 10, roleId } = queryUserDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('user.clientProfile', 'clientProfile')
      .leftJoinAndSelect('user.caregiverProfile', 'caregiverProfile');

    if (search) {
      queryBuilder.where(
        '(user.email LIKE :search OR user.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId });
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async remove(user: User): Promise<void> {
    await this.repository.remove(user);
  }

  // Transaction methods
  async findByIdWithQueryRunner(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<User | null> {
    return queryRunner.manager.findOne(User, { where: { id } });
  }

  async findByEmailWithQueryRunner(
    queryRunner: QueryRunner,
    email: string,
  ): Promise<User | null> {
    return queryRunner.manager.findOne(User, { where: { email } });
  }

  async findByPhoneWithQueryRunner(
    queryRunner: QueryRunner,
    phone: string,
  ): Promise<User | null> {
    return queryRunner.manager.findOne(User, { where: { phone } });
  }

  async findByEmailOrPhoneWithQueryRunner(
    queryRunner: QueryRunner,
    email: string,
    phone: string,
  ): Promise<User | null> {
    return queryRunner.manager.findOne(User, {
      where: [{ email }, { phone }],
    });
  }

  async createWithQueryRunner(
    queryRunner: QueryRunner,
    userData: Partial<User>,
  ): Promise<User> {
    const user = queryRunner.manager.create(User, userData);
    return queryRunner.manager.save(user);
  }

  async updateWithQueryRunner(
    queryRunner: QueryRunner,
    user: User,
  ): Promise<User> {
    return queryRunner.manager.save(user);
  }

  async removeWithQueryRunner(
    queryRunner: QueryRunner,
    user: User,
  ): Promise<void> {
    await queryRunner.manager.remove(user);
  }

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  async getUserPaymentSummary(
    userId: string,
    paymentStatus?: PaymentStatus,
  ): Promise<{
    totalEarned: number;
    availableAmount: number;
    totalCompleted: number;
    totalPending: number;
    bookingCount: number;
    totalHours: number;
    averageHourlyRate: number;
    monthlyBreakdown: Array<{
      month: string;
      totalAmount: number;
      completedAmount: number;
      pendingAmount: number;
      payments: Array<{
        id: string;
        amount: number;
        status: PaymentStatus;
        transactionId: string;
        bookingId: string;
        paymentDate: Date;
        serviceType: string;
        duration: number;
      }>;
    }>;
  }> {
    // Build the query with proper joins
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .innerJoin('user.caregiverProfile', 'caregiverProfile')
      .leftJoin(
        'payments',
        'payment',
        'payment.caregiverId = caregiverProfile.id',
      )
      .leftJoin('bookings', 'booking', 'payment.bookingId = booking.id')
      .where('user.id = :userId', { userId })
      .andWhere(
        '(booking.status IS NULL OR booking.status IN (:...statuses))',
        {
          statuses: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
            BookingStatus.COMPLETED,
          ],
        },
      );

    // Optional payment status filter
    if (paymentStatus) {
      queryBuilder.andWhere('payment.status = :paymentStatus', {
        paymentStatus,
      });
    }

    
    queryBuilder
      .select([
        'payment.id',
        'payment.amount',
        'payment.status',
        'payment.transactionId',
        'payment.bookingId',
        'payment.createdAt',
        'booking.serviceType',
        'booking.duration',
        'booking.date',
      ])
      .orderBy('booking.date', 'DESC')
      .addOrderBy('booking.startTime', 'DESC');

    const payments = await queryBuilder.getRawMany();

 
    let totalCompleted = 0;
    let totalPending = 0;
    let totalHours = 0;
    const bookingIds = new Set<string>();

    payments.forEach((payment) => {
      const amount = parseFloat(payment.payment_amount) || 0;
      const duration = parseInt(payment.booking_duration) || 0;

      if (payment.payment_status === PaymentStatus.SUCCESSFUL) {
        totalCompleted += amount;
      } else if (payment.payment_status === PaymentStatus.PENDING) {
        totalPending += amount;
      }

      totalHours += duration;
      bookingIds.add(payment.payment_bookingId);
    });

    const totalEarned = totalCompleted + totalPending;
    const bookingCount = bookingIds.size;
    const averageHourlyRate = totalHours > 0 ? totalEarned / totalHours : 0;

    
    const monthlyMap = new Map<
      string,
      {
        month: string;
        totalAmount: number;
        completedAmount: number;
        pendingAmount: number;
        payments: Array<{
          id: string;
          amount: number;
          status: PaymentStatus;
          transactionId: string;
          bookingId: string;
          paymentDate: Date;
          serviceType: string;
          duration: number;
        }>;
      }
    >();

    payments.forEach((payment) => {
      const date = new Date(payment.booking_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          totalAmount: 0,
          completedAmount: 0,
          pendingAmount: 0,
          payments: [],
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      const amount = parseFloat(payment.payment_amount) || 0;

      if (payment.payment_status === PaymentStatus.SUCCESSFUL) {
        monthData.totalAmount += amount;
        monthData.completedAmount += amount;
      } else if (payment.payment_status === PaymentStatus.PENDING) {
        monthData.pendingAmount += amount;
      }

      monthData.payments.push({
        id: payment.payment_id,
        amount: amount,
        status: payment.payment_status,
        transactionId: payment.payment_transactionId,
        bookingId: payment.payment_bookingId,
        paymentDate: payment.payment_createdAt,
        serviceType: payment.booking_serviceType,
        duration: parseInt(payment.booking_duration) || 0,
      });
    });

   
    const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) =>
      b.month.localeCompare(a.month),
    );

   
    monthlyBreakdown.forEach((month) => {
      month.payments.sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() -
          new Date(a.paymentDate).getTime(),
      );
    });

    return {
      totalEarned: Math.round(totalEarned * 100) / 100,
      availableAmount: Math.round(totalCompleted * 100) / 100,
      totalCompleted: Math.round(totalCompleted * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      bookingCount,
      totalHours,
      averageHourlyRate: Math.round(averageHourlyRate * 100) / 100,
      monthlyBreakdown,
    };
  }
}
