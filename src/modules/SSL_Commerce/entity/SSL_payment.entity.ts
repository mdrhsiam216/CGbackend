import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../user/entities/user.entity';
import {
  PaymentStatus,
  CaregiverPaymentStatus,
  Currency,
  PaymentMethod,
} from '../enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking, (booking) => booking.payment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid', nullable: false })
  bookingId: string;

  @ManyToOne(() => User, (user) => user.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: Currency.BDT })
  currency: Currency;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionId: string; // SSLCommerz transaction ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionKey: string; // SSLCommerz session key

  @Column({ type: 'varchar', length: 100, nullable: true })
  valId: string; // SSLCommerz validation ID

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: PaymentMethod; // 'sslcommerz', 'card', 'mobile_banking', etc.

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: {
    bankName?: string;
    cardType?: string;
    cardNo?: string;
    mobileBanking?: string;
    wallet?: string;
    bankTranId?: string;
  };

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paymentInitiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentCompletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentFailedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  sslCommerzResponse: {
    gatewayPageURL?: string;
    redirectGatewayURL?: string;
    storeBanner?: string;
    desc?: any[];
    is_direct_pay_enable?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  validationResponse: {
    status?: string;
    tran_date?: string;
    tran_id?: string;
    val_id?: string;
    amount?: string;
    store_amount?: string;
    currency?: string;
    bank_tran_id?: string;
    card_type?: string;
    card_no?: string;
    card_issuer?: string;
    card_brand?: string;
    card_issuer_country?: string;
    card_issuer_country_code?: string;
    currency_type?: string;
    currency_amount?: string;
    currency_rate?: string;
    base_fair?: string;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
    risk_title?: string;
    risk_level?: string;
    [key: string]: any;
  };

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'uuid', nullable: true })
  caregiverId: string;

  @Column({
    type: 'enum',
    enum: CaregiverPaymentStatus,
    default: CaregiverPaymentStatus.PENDING,
  })
  caregiverPaymentStatus: CaregiverPaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  caregiverTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  caregiverPaidAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netPayable: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payoutMethod: string;

  @Column({ type: 'boolean', default: false })
  isRefundable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCESSFUL;
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  canBeRefunded(): boolean {
    return this.isSuccessful() && this.isRefundable;
  }
}
