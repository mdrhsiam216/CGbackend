import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CertificateStatus } from '../entities/certificate.entity';

export class ResponseCertificateDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  caregiverProfileId: string;

  @ApiProperty({ example: 'Bachelor of Nursing' })
  @Expose()
  title: string;

  @ApiPropertyOptional({ example: 'Harvard University' })
  @Expose()
  institution?: string;

  @ApiPropertyOptional({ example: '2020' })
  @Expose()
  yearOfCompletion?: string;

  @ApiProperty({
    example:
      'https://caregiver-image-bucket.s3.ap-southeast-1.amazonaws.com/certificates/abc123.pdf',
  })
  @Expose()
  certificateUrl: string;

  @ApiProperty({ enum: CertificateStatus, example: CertificateStatus.APPROVED })
  @Expose()
  status: CertificateStatus;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
