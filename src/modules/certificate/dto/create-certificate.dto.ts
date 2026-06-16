import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({
    example: 'Bachelor of Nursing',
    description: 'Title of the certificate/education',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Harvard University',
    description: 'Institution where the certificate was obtained',
  })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional({
    example: '2020',
    description: 'Year of completion',
  })
  @IsOptional()
  @IsString()
  yearOfCompletion?: string;

  @ApiProperty({
    example: 'https://bucket.s3.amazonaws.com/certificates/abc123.pdf',
    description:
      'URL of the certificate document (obtained from upload endpoint)',
  })
  @IsNotEmpty()
  @IsString()
  certificateUrl: string;

  @ApiProperty({
    example: 'certificates/user123/certificate.pdf',
    description:
      'Storage key for the certificate document (obtained from upload endpoint)',
  })
  @IsNotEmpty()
  @IsString()
  certificateKey: string;
}
