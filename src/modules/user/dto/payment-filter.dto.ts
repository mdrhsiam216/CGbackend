import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '../../SSL_Commerce/enums/ssl-commerce.enums';

export class PaymentFilterDto {
  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
    example: PaymentStatus.SUCCESSFUL,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
