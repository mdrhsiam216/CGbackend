import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import {
  RoleErrorMessages,
  UserErrorMessages,
  CaregiverProfileErrorMessages,
  UserStatus,
} from 'src/shared/enums';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';
import { RoleService } from '../role/role.service';
import { UserRoleService } from '../user-role/user-role.service';
import { S3Service } from '../../shared/aws/services/s3.service';
import { UploadedFile } from '../../shared/aws/interfaces/s3.interface';
import { PaymentStatus } from '../SSL_Commerce/enums/ssl-commerce.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user-dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPaymentSummaryDto } from './dto/user-payment-summary.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './repository/user.repository';


@Injectable()
export class UserService {
  private readonly logTag = ServiceTags.USER_SERVICE;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
    private readonly userRoleService: UserRoleService,
    private readonly s3Service: S3Service,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    try {
      // Check for existing user
      const existingUser = await this.userRepository.findByEmail(
        createUserDto.email,
      );

      if (existingUser) {
        if (existingUser.email === createUserDto.email) {
          throw new ConflictException(UserErrorMessages.EMAIL_ALREADY_EXISTS);
        }
        // throw new ConflictException(UserErrorMessages.PHONE_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Create user
      const savedUser = await this.userRepository.create({
        email: createUserDto.email,
        password: hashedPassword,
        phone: createUserDto.phone,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        status: createUserDto.status || UserStatus.ACTIVE,
        emergencyContacts: createUserDto.emergencyContacts,
      });

      // Assign role if provided
      if (createUserDto.roleId) {
        await this.assignRoleById(savedUser.id, createUserDto.roleId);
      }

      return this.findOneUser(savedUser.id);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        UserErrorMessages.USER_CREATION_FAILED,
      );
    }
  }

  async findAllUsers(queryUserDto: QueryUserDto): Promise<{
    data: ResponseUserDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10 } = queryUserDto;
      const { data, total } = await this.userRepository.findAll(queryUserDto);
      return {
        data: plainToInstance(ResponseUserDto, data, {
          excludeExtraneousValues: true,
        }),
        total,
        page,
        limit,
      };
    } catch {
      throw new InternalServerErrorException(
        UserErrorMessages.USER_FETCH_FAILED,
      );
    }
  }

  async findOneUser(id: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findEntityById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch {
      throw new InternalServerErrorException(
        UserErrorMessages.FAILED_TO_FETCH_USER_BY_EMAIL,
      );
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      return await this.userRepository.findByPhone(phone);
    } catch {
      throw new InternalServerErrorException(
        UserErrorMessages.FAILED_TO_FETCH_USER_BY_PHONE,
      );
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);

      // Check for email conflict
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findByEmail(
          updateUserDto.email,
        );
        if (existingUser)
          throw new ConflictException(UserErrorMessages.EMAIL_ALREADY_EXISTS);
      }

      // Check for phone conflict
      if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
        const existingUser = await this.userRepository.findByPhone(
          updateUserDto.phone,
        );
        if (existingUser)
          throw new ConflictException(UserErrorMessages.PHONE_ALREADY_EXISTS);
      }

      Object.assign(user, updateUserDto);
      await this.userRepository.update(user);

      // Update roles if provided
      if (updateUserDto.roleId) {
        await this.updateRoleById(user.id, updateUserDto.roleId);
      }

      return this.findOneUser(user.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        UserErrorMessages.USER_UPDATE_FAILED,
      );
    }
  }

  async updateUserPassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);

    const isPasswordValid = await this.comparePasswords(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException(UserErrorMessages.INVALID_CREDENTIALS);

    const isSameAsCurrent = await this.comparePasswords(
      updatePasswordDto.newPassword,
      user.password,
    );
    if (isSameAsCurrent)
      throw new BadRequestException(UserErrorMessages.PASSWORD_NOT_BE_SAME);

    user.password = await this.hashPassword(updatePasswordDto.newPassword);
    await this.userRepository.update(user);
  }

  async removeUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      if (user.avatarKey) {
        try {
          await this.s3Service.deleteFile(user.avatarKey);
        } catch (error) {
          this.logger.error(
            this.logTag,
            UserErrorMessages.AVATAR_DELETION_FAILED,
            error,
          );
        }
      }

      await this.userRepository.remove(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        UserErrorMessages.USER_DELETION_FAILED,
      );
    }
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
    avatar?: UploadedFile,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);

      // Check for phone conflict if phone is being updated
      if (updateProfileDto.phone && updateProfileDto.phone !== user.phone) {
        const existingUser = await this.userRepository.findByPhone(
          updateProfileDto.phone,
        );
        if (existingUser)
          throw new ConflictException(UserErrorMessages.PHONE_ALREADY_EXISTS);
      }

      // Handle avatar upload if provided
      if (avatar) {
        // Delete old avatar if exists
        if (user.avatarKey) {
          try {
            await this.s3Service.deleteFile(user.avatarKey);
          } catch (error) {
            // Log error but don't fail the update if deletion fails
            this.logger.error(
              this.logTag,
              UserErrorMessages.AVATAR_DELETION_FAILED,
              error,
            );
          }
        }

        // Upload new avatar
        const uploadResult = await this.s3Service.uploadImage(
          avatar,
          'avatars',
        );
        user.avatarUrl = uploadResult.url;
        user.avatarKey = uploadResult.key;
      }

      // Update other profile fields
      if (updateProfileDto.firstName !== undefined) {
        user.firstName = updateProfileDto.firstName;
      }
      if (updateProfileDto.lastName !== undefined) {
        user.lastName = updateProfileDto.lastName;
      }
      if (updateProfileDto.phone !== undefined) {
        user.phone = updateProfileDto.phone;
      }

      await this.userRepository.update(user);
      return this.findOneUser(user.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        UserErrorMessages.USER_UPDATE_FAILED,
      );
    }
  }

  async updateUserStatus(
    id: string,
    status: UserStatus,
  ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);

    user.status = status;
    await this.userRepository.update(user);
    return this.findOneUser(id);
  }

  async getUserPaymentSummary(
    userId: string,
    paymentStatus?: PaymentStatus,
  ): Promise<UserPaymentSummaryDto> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(UserErrorMessages.USER_NOT_FOUND);
      }

      if (!user.caregiverProfile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      const summary =
        await this.userRepository.getUserPaymentSummary(userId, paymentStatus);

      return {
        totalEarned: summary.totalEarned,
        availableAmount: summary.availableAmount,
        totalCompleted: summary.totalCompleted,
        totalPending: summary.totalPending,
        bookingCount: summary.bookingCount,
        totalHours: summary.totalHours,
        averageHourlyRate: summary.averageHourlyRate,
        monthlyBreakdown: summary.monthlyBreakdown.map((month) => ({
          month: month.month,
          totalAmount: month.totalAmount,
          completedAmount: month.completedAmount,
          pendingAmount: month.pendingAmount,
          payments: month.payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            transactionId: payment.transactionId,
            bookingId: payment.bookingId,
            paymentDate: payment.paymentDate,
            serviceType: payment.serviceType,
            duration: payment.duration,
          })),
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        UserErrorMessages.FAILED_TO_FETCH_USER_TOTAL_PAYMENT_AMOUNT,
        error,
        this.logTag,
      );
      throw new InternalServerErrorException(
        UserErrorMessages.FAILED_TO_FETCH_USER_TOTAL_PAYMENT_AMOUNT,
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async assignRole(userId: string, roleName: string) {
    let role;
    try {
      role = await this.roleService.findByRoleName(roleName);
    } catch (error) {
      if (error instanceof NotFoundException) {
       
        try {
          role = await this.roleService.findByRoleName(roleName.toUpperCase());
        } catch {
          
        }
      } else {
        throw error;
      }
    }

    if (!role) throw new BadRequestException(RoleErrorMessages.ROLE_NOT_FOUND);
    await this.userRoleService.bulkAssignRoles(userId, [role]);
  }

  private async assignRoleById(userId: string, roleId: string) {
    try {
      const role = await this.roleService.findOneRole(roleId);
      await this.userRoleService.bulkAssignRoles(userId, [role]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(RoleErrorMessages.ROLE_NOT_FOUND);
      }
      throw error;
    }
  }

  private async updateRole(userId: string, roleName: string) {
    await this.userRoleService.removeRolesByUserId(userId);
    await this.assignRole(userId, roleName);
  }

  private async updateRoleById(userId: string, roleId: string) {
    await this.userRoleService.removeRolesByUserId(userId);
    await this.assignRoleById(userId, roleId);
  }
}
