import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { CertificateStatus } from '../entities/certificate.entity';

export class UpdateCertificateStatusDto {
  @ApiProperty({
    enum: CertificateStatus,
    example: CertificateStatus.APPROVED,
    description: 'New status for the certificate',
  })
  @IsNotEmpty()
  @IsEnum(CertificateStatus)
  status: CertificateStatus;
}
