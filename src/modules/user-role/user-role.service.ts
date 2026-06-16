import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRoleErrorMessages } from 'src/shared/enums';
import { Role } from '../role/entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { UserRoleRepository } from './repository/user-role.repository';

@Injectable()
export class UserRoleService {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.findByUserId(userId);
  }

  /**
   * Bulk assign roles to a user
   */
  async bulkAssignRoles(userId: string, roles: Role[]): Promise<void> {
    if (!roles.length) {
      throw new BadRequestException(
        UserRoleErrorMessages.USER_ROLE_ASSIGN_FAILED,
      );
    }

    const userRolesData = roles.map((role) => ({
      user: { id: userId },
      role: { id: role.id },
    }));

    try {
      await this.userRoleRepository.bulkCreate(userRolesData);
    } catch (error) {
      throw new InternalServerErrorException(
        UserRoleErrorMessages.USER_ROLE_ASSIGN_FAILED,
      );
    }
  }

  /**
   * Remove all roles of a specific user
   */
  async removeRolesByUserId(userId: string): Promise<void> {
    try {
      await this.userRoleRepository.deleteByUserId(userId);
    } catch (error) {
      throw new InternalServerErrorException(
        UserRoleErrorMessages.USER_ROLE_REMOVE_FAILED,
      );
    }
  }
}
