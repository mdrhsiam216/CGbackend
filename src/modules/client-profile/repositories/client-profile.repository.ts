import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryClientProfileDto } from '../dto/query-client-profile.dto';
import { ClientProfile } from '../entities/client-profile.entity';

@Injectable()
export class ClientProfileRepository {
  constructor(
    @InjectRepository(ClientProfile)
    private readonly repository: Repository<ClientProfile>,
  ) {}

  async findById(id: string): Promise<ClientProfile | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'user.addresses'],
    });
  }

  async findByUserId(userId: string): Promise<ClientProfile | null> {
    return this.repository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'user.addresses'],
    });
  }

  async findAll(
    queryDto: QueryClientProfileDto,
  ): Promise<{ data: ClientProfile[]; total: number }> {
    const { search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('clientProfile')
      .leftJoinAndSelect('clientProfile.user', 'user')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .orderBy('clientProfile.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
        "(user.firstName LIKE :search OR user.lastName LIKE :search OR CONCAT(user.firstName, ' ', user.lastName) LIKE :search)",
        { search: `%${search}%` },
      );
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findByDateOfBirthRange(
    startDate: Date,
    endDate: Date,
  ): Promise<ClientProfile[]> {
    return this.repository
      .createQueryBuilder('clientProfile')
      .leftJoinAndSelect('clientProfile.user', 'user')
      .where('clientProfile.dateOfBirth BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('clientProfile.createdAt', 'DESC')
      .getMany();
  }

  async createProfile(
    profileData: Partial<ClientProfile>,
  ): Promise<ClientProfile> {
    const profile = this.repository.create(profileData);
    return this.repository.save(profile);
  }

  async updateProfile(profile: ClientProfile): Promise<ClientProfile> {
    return this.repository.save(profile);
  }

  async removeProfile(profile: ClientProfile): Promise<void> {
    await this.repository.remove(profile);
  }
}
