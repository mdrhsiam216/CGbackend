import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner } from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    return this.repository.findBy({ id: In(ids) });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repository.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  // Transaction methods
  async findByIdsWithQueryRunner(
    queryRunner: QueryRunner,
    ids: string[],
  ): Promise<Role[]> {
    return queryRunner.manager.findBy(Role, { id: In(ids) });
  }
}
