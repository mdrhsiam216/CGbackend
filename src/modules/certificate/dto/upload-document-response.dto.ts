import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadDocumentResponseDto {
  @ApiProperty({
    example: 'https://bucket.s3.amazonaws.com/certificates/abc123.pdf',
    description: 'URL of the uploaded document',
  })
  @Expose()
  url: string;

  @ApiProperty({
    example: 'certificates/user123/document.pdf',
    description: 'Storage key for the uploaded document',
  })
  @Expose()
  key: string;
}
