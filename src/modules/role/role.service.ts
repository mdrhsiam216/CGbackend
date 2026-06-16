import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleErrorMessages } from 'src/shared/enums';
import { DataSource, In, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(RoleErrorMessages.ROLE_ALREADY_EXISTS);
      }

      const role = this.roleRepository.create(createRoleDto);
      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_CREATION_FAILED,
      );
    }
  }

  async findAllRoles(): Promise<Role[]> {
    try {
      return await this.roleRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_FETCH_FAILED,
      );
    }
  }

  async findOneRole(id: string): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(RoleErrorMessages.ROLE_NOT_FOUND);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_FETCH_FAILED,
      );
    }
  }

  async findByRoleName(name: string): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({
        where: { name },
      });

      if (!role) {
        throw new NotFoundException(RoleErrorMessages.ROLE_NOT_FOUND);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_FETCH_FAILED,
      );
    }
  }

  async findByRoleIds(ids: string[]): Promise<Role[]> {
    try {
      const roles = await this.roleRepository.findBy({ id: In(ids) });

      if (roles.length !== ids.length) {
        throw new BadRequestException(RoleErrorMessages.ROLE_ID_INVALID);
      }

      return roles;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_FETCH_FAILED,
      );
    }
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });

      if (!role) {
        throw new NotFoundException(RoleErrorMessages.ROLE_NOT_FOUND);
      }

      // Check if new name conflicts with existing role
      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existingRole = await this.roleRepository.findOne({
          where: { name: updateRoleDto.name },
        });

        if (existingRole) {
          throw new ConflictException(RoleErrorMessages.ROLE_ALREADY_EXISTS);
        }
      }

      Object.assign(role, updateRoleDto);
      return await this.roleRepository.save(role);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_UPDATE_FAILED,
      );
    }
  }

  async removeRole(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(Role, {
        where: { id },
        relations: ['userRoles'],
      });

      if (!role) {
        throw new NotFoundException(RoleErrorMessages.ROLE_NOT_FOUND);
      }

      // Check if role is assigned to any users
      if (role.userRoles && role.userRoles.length > 0) {
        throw new BadRequestException(RoleErrorMessages.ROLE_ASSIGNED_TO_USERS);
      }

      await queryRunner.manager.remove(role);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_DELETION_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getRoleWithUserCount(id: string): Promise<{
    role: Role;
    userCount: number;
  }> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['userRoles'],
      });

      if (!role) {
        throw new NotFoundException(RoleErrorMessages.ROLE_NOT_FOUND);
      }

      return {
        role,
        userCount: role.userRoles?.length || 0,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        RoleErrorMessages.ROLE_FETCH_FAILED,
      );
    }
  }
}
