import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SSLCommerzPayment from 'sslcommerz-lts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entity/SSL_payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../user/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';
import { TransactionStatusMessage } from '../../shared/enums';
import {
  PaymentStatus,
  CaregiverPaymentStatus,
  Currency,
  PaymentMethod,
  SSLCommerzStatus,
  ProductCategory,
  ShippingMethod,
  ProductProfile,
  SSLCommerceErrorMessage,
} from './enums';
import { BookingStatus } from '../bookings/enums';
import { PaymentData } from './enums/ssl-commerce.enums';

@Injectable()
export class SSLCommerceService {

    private sslcommerz: any;
    constructor(
        private configService: ConfigService,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,
    ) {
        const isSandbox = this.configService.get<string>('SSL_COMMERCE_IS_SANDBOX') === 'true';
        
        
        const store_id = isSandbox 
            ? this.configService.get<string>('STORE_ID_SANDBOX')
            : this.configService.get<string>('STORE_ID');
            
        const store_password = isSandbox
            ? this.configService.get<string>('STORE_PASSWORD_SANDBOX')
            : this.configService.get<string>('STORE_PASSOWRD');
            
        this.sslcommerz = new SSLCommerzPayment(store_id, store_password, isSandbox);

    }

    async initPayment(paymentData: PaymentData) {
        try {
            const isSandbox = this.configService.get<string>('SSL_COMMERCE_IS_SANDBOX') === 'true';
            
          
            const store_id = isSandbox 
                ? this.configService.get<string>('STORE_ID_SANDBOX')
                : this.configService.get<string>('STORE_ID');
                
            const store_passwd = isSandbox
                ? this.configService.get<string>('STORE_PASSWORD_SANDBOX')
                : this.configService.get<string>('STORE_PASSOWRD');
            
            const formData = new URLSearchParams();
            formData.append('store_id', store_id || '');
            formData.append('store_passwd', store_passwd || '');
            formData.append('total_amount', paymentData.total_amount.toString());
            formData.append('currency', paymentData.currency);
            formData.append('tran_id', paymentData.tran_id);
            formData.append('success_url', paymentData.success_url);
            formData.append('fail_url', paymentData.fail_url);
            formData.append('cancel_url', paymentData.cancel_url);
            formData.append('shipping_method', paymentData.shipping_method || ShippingMethod.COURIER);
            formData.append('product_name', paymentData.product_name || ProductCategory.SERVICE);
            formData.append('product_category', paymentData.product_category || ProductCategory.SERVICE);
            formData.append('product_profile', paymentData.product_profile || ProductProfile.GENERAL);
            formData.append('cus_name', paymentData.cus_name);
            formData.append('cus_email', paymentData.cus_email);
            formData.append('cus_add1', paymentData.cus_add1 || '');
            formData.append('cus_city', paymentData.cus_city || '');
            formData.append('cus_postcode', paymentData.cus_postcode || '');
            formData.append('cus_country', paymentData.cus_country || '');
            formData.append('cus_phone', paymentData.cus_phone);
            formData.append('ship_name', paymentData.ship_name || paymentData.cus_name);
            formData.append('ship_add1', paymentData.ship_add1 || paymentData.cus_add1 || '');
            formData.append('ship_city', paymentData.ship_city || paymentData.cus_city || '');
            formData.append('ship_postcode', paymentData.ship_postcode?.toString() || '');
            formData.append('ship_country', paymentData.ship_country || paymentData.cus_country || '');

            if (paymentData.ipn_url) {
                formData.append('ipn_url', paymentData.ipn_url);
            }

            
            const apiUrl = isSandbox 
                ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
                : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const apiResponnse = await response.json();
            if (apiResponnse?.GatewayPageURL) {
                return {
                    gateway_Url: apiResponnse.GatewayPageURL,
                    transaction_Id: paymentData.tran_id,
                    session_key: apiResponnse.sessionkey
                }
            } else {
                return apiResponnse;
            }
        } catch (error) {
            throw new BadRequestException(
                `SSLCommerz Payment Init Failed: ${error.message}`
            );
        }
    }

  async validatePayment(valId: string): Promise<any> {
    try {
      const response = await this.sslcommerz.validate({ val_id: valId });
      return response;
    } catch (error) {
      throw new Error(`Payment Validation Failed: ${error.message}`);
    }
  }

  async transactionQuery(tranId: string): Promise<any> {
    try {
      const response = await this.sslcommerz.transactionQueryByTransactionId({
        tran_id: tranId,
      });
      return response;
    } catch (error) {
      throw new Error(`Transaction Query Failed: ${error.message}`);
    }
  }

  async initiateBookingPayment(bookingId: string, user: User) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(SSLCommerceErrorMessage.BOOKING_NOT_FOUND);
    }

    const tran_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = this.paymentRepository.create({
      bookingId: booking.id,
      userId: user.id,
      amount: booking.totalAmount,
      currency: Currency.BDT,
      transactionId: tran_id,
      status: PaymentStatus.PENDING,
      paymentInitiatedAt: new Date(),
      cus_name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || 'Unknown',
      cus_email: user.email,
      cus_phone: user.phone || '0000000000',
    } as any);

    await this.paymentRepository.save(payment);

    const paymentData: PaymentData = {
      total_amount: booking.totalAmount,
      currency: Currency.BDT,
      tran_id: tran_id,
      success_url: `${this.configService.get('APP_URL')}/ssl-commerce/success?tran_id=${tran_id}`,
      fail_url: `${this.configService.get('APP_URL')}/ssl-commerce/fail?tran_id=${tran_id}`,
      cancel_url: `${this.configService.get('APP_URL')}/ssl-commerce/cancel?tran_id=${tran_id}`,
      cus_name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || 'Unknown',
      cus_email: user.email,
      cus_phone: user.phone || '0000000000',
      product_name: `Booking Service: ${booking.serviceType}`,
      product_category: ProductCategory.CAREGIVER_SERVICE,
    };

    return this.initPayment(paymentData);
  }

  async createPaymentRecordForBooking(
    bookingId: string,
    amount: number,
    transactionId: string,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payment = this.paymentRepository.create({
      bookingId: booking.id,
      userId: booking.userId,
      amount: amount,
      currency: Currency.BDT,
      transactionId: transactionId,
      status: PaymentStatus.SUCCESSFUL,
      paymentInitiatedAt: new Date(),
      caregiverPaymentStatus: CaregiverPaymentStatus.PENDING,
      cus_name:
        booking.user?.firstName && booking.user?.lastName
          ? `${booking.user.firstName} ${booking.user.lastName}`
          : booking.user?.firstName || booking.user?.lastName || 'Unknown',
      cus_email: booking.user?.email || 'unknown@example.com',
      cus_phone: booking.user?.phone || '0000000000',
      paymentMethod: PaymentMethod.SSLCOMMERZ,
    } as any);

    return this.paymentRepository.save(payment);
  }

  async getCompletedBookingsForAdmin() {
    const payments = await this.paymentRepository.find({
      where: {
        booking: {
          status: BookingStatus.COMPLETED,
        },
        caregiverPaymentStatus: CaregiverPaymentStatus.PENDING,
      },
      relations: ['booking', 'booking.caregiver', 'booking.caregiver.user', 'user'],
      order: {
        updatedAt: 'DESC',
      },
    });

        return payments.map(p => ({
            paymentId: p.id,
            bookingId: p.bookingId,
            caregiverId: p.booking.caregiverId,
            caregiverName: p.booking.caregiver ? `${p.booking.caregiver.user.firstName} ${p.booking.caregiver.user.lastName}` : 'Not available',
            serviceType: p.booking.serviceType,
            amount: p.amount,
            caregiverPaymentStatus: p.caregiverPaymentStatus,
            transactionId: p.transactionId, 
        }));
    }

  async payCaregiver(bookingId: string, transactionId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException(
        SSLCommerceErrorMessage.PAYMENT_RECORD_NOT_FOUND,
      );
    }

    if (payment.booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        SSLCommerceErrorMessage.BOOKING_NOT_COMPLETED,
      );
    }

    if (payment.caregiverPaymentStatus === CaregiverPaymentStatus.PAID) {
      throw new BadRequestException(
        SSLCommerceErrorMessage.CAREGIVER_ALREADY_PAID,
      );
    }

    payment.caregiverPaymentStatus = CaregiverPaymentStatus.PAID;
    payment.caregiverTransactionId = transactionId;
    payment.caregiverPaidAt = new Date();
    payment.caregiverId = payment.booking.caregiverId;

    return this.paymentRepository.save(payment);
  }

  async handlePaymentSuccess(tranId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: tranId },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException(SSLCommerceErrorMessage.PAYMENT_NOT_FOUND);
    }

    if (payment.status === PaymentStatus.SUCCESSFUL) {
      return { message: 'Payment already successful', payment };
    }

       
        try {
            const validationResponse = await this.transactionQuery(tranId);

    
            if (!validationResponse || validationResponse.status !== 'VALID') {
                throw new BadRequestException('Payment validation failed - transaction not valid');
            }

            // Update payment status
            payment.status = PaymentStatus.SUCCESSFUL;
            payment.paymentCompletedAt = new Date();
            await this.paymentRepository.save(payment);

            // Update Booking status
            if (payment.booking) {
                payment.booking.status = TransactionStatusMessage.CONFIRMED;
                payment.booking.isPaid = true;
                payment.booking.paidAmount = validationResponse.amount || payment.amount;
                await this.bookingRepository.save(payment.booking);
            }

            return { message: 'Payment successful', payment };
        } catch (error) {
            console.error('Payment validation error:', error);
            throw new BadRequestException(`Payment validation failed: ${error.message}`);
        }
    }

    async processAutomatedPayout(bookingId: string) {

    const payment = await this.paymentRepository.findOne({
        where: { bookingId },
        relations: ['booking']
    });

    if (!payment) {
        throw new NotFoundException('Payment record not found for this booking');
    }

    if (payment.caregiverPaymentStatus === 'paid') {
        return { message: 'Caregiver already paid', payment };
    }

    const totalAmount = Number(payment.amount);
    const platformFee = totalAmount * 0.10; 
    const netPayable = totalAmount - platformFee;

    const mockPayoutTransactionId = `TRX-AUTO-${Date.now()}`;
    const payoutSuccess = true;
   
    if (payoutSuccess) {
        payment.caregiverPaymentStatus = CaregiverPaymentStatus.PAID;
        payment.caregiverTransactionId = mockPayoutTransactionId;
        payment.caregiverPaidAt = new Date();
        payment.caregiverId = payment.booking.caregiverId;
        payment.platformFee = platformFee;
        payment.netPayable = netPayable;
        payment.payoutMethod = PaymentMethod.MOCK_BANK_TRANSFER;

        await this.paymentRepository.save(payment);

        return { success: true, message: 'Automated payout successful', payment };
    } else {
        return { success: false, message: 'Automated payout failed' };
    }
}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async checkPendingBookings() {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const pendingBookings = await this.bookingRepository.find({
      where: {
        status: TransactionStatusMessage.PENDING,
        createdAt: LessThan(fifteenMinutesAgo),
        isPaid: false,
      },
    });

    for (const booking of pendingBookings) {
      try {
        const response = await this.sslcommerz.transactionQueryByTransactionId(
          booking.id,
        );
        const element = response?.element?.[0];

                if (element && (element.status === SSLCommerzStatus.VALID || element.status === SSLCommerzStatus.VALIDATED)) {

          booking.status = TransactionStatusMessage.CONFIRMED;
          booking.isPaid = true;
          booking.paidAmount = element.amount;
          await this.bookingRepository.save(booking);

                    await this.createPaymentRecordForBooking(booking.id, Number(element.amount), element.tran_id || booking.id);
                } else if (element && (element.status === SSLCommerzStatus.FAILED || element.status === SSLCommerzStatus.CANCELLED)) {
                    booking.status = TransactionStatusMessage.CANCELLED;
                    await this.bookingRepository.save(booking);
                }
            } catch (error) {
                console.error(`Error checking booking ${booking.id}:`, error.message);
            }
        }
    }
}
