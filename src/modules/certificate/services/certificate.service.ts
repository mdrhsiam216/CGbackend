import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  CertificateErrorMessages,
  CaregiverProfileErrorMessages,
} from 'src/shared/enums';
import { ServiceTags } from '../../../common/enums/logging-tag.enum';
import type { ILogger } from '../../../shared/interfaces/logger.interface';
import { S3Service } from '../../../shared/aws/services/s3.service';
import type { UploadedFile } from '../../../shared/aws/interfaces/s3.interface';
import { CertificateRepository } from '../repositories/certificate.repository';
import { CaregiverProfileRepository } from '../../caregiver-profile/repositories/caregiver-profile.repository';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { ResponseCertificateDto } from '../dto/response-certificate.dto';
import { UpdateCertificateStatusDto } from '../dto/update-certificate-status.dto';
import { Certificate, CertificateStatus } from '../entities/certificate.entity';

@Injectable()
export class CertificateService {
  private readonly logTag = ServiceTags.CAREGIVER_PROFILE_SERVICE;

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly caregiverProfileRepository: CaregiverProfileRepository,
    private readonly s3Service: S3Service,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async uploadDocument(
    file: UploadedFile,
  ): Promise<{ url: string; key: string }> {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException(
          CertificateErrorMessages.CERTIFICATE_FILE_REQUIRED,
        );
      }

      // Validate file type (PDF, JPG, JPEG, PNG)
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          CertificateErrorMessages.INVALID_CERTIFICATE_FILE_TYPE,
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          CertificateErrorMessages.CERTIFICATE_FILE_SIZE_EXCEEDED,
        );
      }

      // Upload file to S3
      const uploadResult = await this.s3Service.uploadFile(file, {
        folder: 'certificates',
        contentType: file.mimetype,
      });

      return {
        url: uploadResult.url,
        key: uploadResult.key,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
        error,
      );
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
      );
    }
  }

  async create(
    caregiverProfileId: string,
    createCertificateDto: CreateCertificateDto,
  ): Promise<ResponseCertificateDto> {
    try {
      // Verify caregiver profile exists
      const caregiverProfile =
        await this.caregiverProfileRepository.findById(caregiverProfileId);
      if (!caregiverProfile) {
        throw new NotFoundException(
          CaregiverProfileErrorMessages.CAREGIVER_PROFILE_NOT_FOUND,
        );
      }

      // Create certificate record
      const certificateData: Partial<Certificate> = {
        caregiverProfileId,
        title: createCertificateDto.title.trim(),
        institution: createCertificateDto.institution?.trim() || undefined,
        yearOfCompletion:
          createCertificateDto.yearOfCompletion?.trim() || undefined,
        certificateUrl: createCertificateDto.certificateUrl,
        certificateKey: createCertificateDto.certificateKey,
        status: CertificateStatus.APPROVED, // Default to approved for now
      };

      const certificate =
        await this.certificateRepository.create(certificateData);

      return plainToInstance(ResponseCertificateDto, certificate, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        this.logTag,
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
        error,
      );
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
      );
    }
  }

  async findAllByCaregiverProfileId(
    caregiverProfileId: string,
  ): Promise<ResponseCertificateDto[]> {
    try {
      const certificates =
        await this.certificateRepository.findByCaregiverProfileId(
          caregiverProfileId,
        );

      return plainToInstance(ResponseCertificateDto, certificates, {
        excludeExtraneousValues: true,
      });
    } catch {
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
      );
    }
  }

  async findOne(id: string): Promise<ResponseCertificateDto> {
    try {
      const certificate = await this.certificateRepository.findById(id);

      if (!certificate) {
        throw new NotFoundException(
          CertificateErrorMessages.CERTIFICATE_NOT_FOUND,
        );
      }

      return plainToInstance(ResponseCertificateDto, certificate, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_CREATION_FAILED,
      );
    }
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateCertificateStatusDto,
  ): Promise<ResponseCertificateDto> {
    try {
      const certificate = await this.certificateRepository.findById(id);

      if (!certificate) {
        throw new NotFoundException(
          CertificateErrorMessages.CERTIFICATE_NOT_FOUND,
        );
      }

      certificate.status = updateStatusDto.status;
      const updatedCertificate =
        await this.certificateRepository.update(certificate);

      return plainToInstance(ResponseCertificateDto, updatedCertificate, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_UPDATE_FAILED,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const certificate = await this.certificateRepository.findById(id);

      if (!certificate) {
        throw new NotFoundException(
          CertificateErrorMessages.CERTIFICATE_NOT_FOUND,
        );
      }

      // Delete file from S3
      try {
        await this.s3Service.deleteFile(certificate.certificateKey);
      } catch (error) {
        // Log error but don't fail the deletion if S3 delete fails
        this.logger.error(
          this.logTag,
          CertificateErrorMessages.CERTIFICATE_DELETION_FAILED,
          error,
        );
      }

      // Delete certificate record
      await this.certificateRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        CertificateErrorMessages.CERTIFICATE_DELETION_FAILED,
      );
    }
  }
}
