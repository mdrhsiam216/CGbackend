import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UserRole } from '../../user-role/entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRole)
    private readonly repository: Repository<UserRole>,
  ) {}

  async findByUserId(userId: string): Promise<UserRole[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['role'],
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ user: { id: userId } });
  }

  async bulkCreate(
    userRolesData: DeepPartial<UserRole>[],
  ): Promise<UserRole[]> {
    const userRoles = this.repository.create(userRolesData);
    return this.repository.save(userRoles);
  }
}
