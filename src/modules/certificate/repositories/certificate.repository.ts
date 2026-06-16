import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../entities/certificate.entity';

@Injectable()
export class CertificateRepository {
  constructor(
    @InjectRepository(Certificate)
    private readonly repository: Repository<Certificate>,
  ) {}

  async create(certificateData: Partial<Certificate>): Promise<Certificate> {
    const certificate = this.repository.create(certificateData);
    return this.repository.save(certificate);
  }

  async findById(id: string): Promise<Certificate | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['caregiverProfile'],
    });
  }

  async findByCaregiverProfileId(
    caregiverProfileId: string,
  ): Promise<Certificate[]> {
    return this.repository.find({
      where: { caregiverProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(certificate: Certificate): Promise<Certificate> {
    return this.repository.save(certificate);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
