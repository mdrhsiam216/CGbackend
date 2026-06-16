import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { PushNotificationService } from '../../shared/push-notification';
import {
  BookingErrorMessages,
  TimeDuration,
  TransactionStatusMessage,
} from 'src/shared/enums';
import { BookingValidationMessage, BookingConstraintMessage, BookingPlaceholder, BookingPaymentCurrency, BookingPaymentUrl, BookingLogMessage, BookingErrorMessage, BookingStatus } from './enums';
import { ServiceTags } from '../../common/enums/logging-tag.enum';
import type { ILogger } from '../../shared/interfaces/logger.interface';
import { CreateBookingDto } from './dtos/booking-caregiver.dto';
import { ResponseBookingDto, BookingDto } from './dtos/booking-response.dto';
import { BookingRepository } from './booking-caregiver.repository';
import { DataSource } from 'typeorm';
import { SSLCommerceService } from '../SSL_Commerce/SSL_commerce.service';
import { Payment } from '../SSL_Commerce/entity/SSL_payment.entity';
import { PaymentStatus, CaregiverPaymentStatus, Currency, PaymentMethod } from '../SSL_Commerce/enums/ssl-commerce.enums';

import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { CaregiverProfileService } from '../caregiver-profile/caregiver-profile.service';
import { Booking } from './entities/booking.entity';
import type { JwtUser } from '../auth/interfaces/auth.interface';
import { UserRole } from 'src/shared/enums';
import { AddressService } from '../address/address.service';
import { calculateDistance } from 'src/shared/utils/location.util';

@Injectable()
export class BookingsService {
  private readonly logTag = ServiceTags.BOOKINGS_SERVICE;
  constructor(
    private readonly repository: BookingRepository,
    private readonly dataSource: DataSource,
    private readonly availabilitySlotService: AvailabilitySlotService,
    @Inject('ILogger') private readonly logger: ILogger,
    private readonly sslCommerceService: SSLCommerceService,
    private readonly configService: ConfigService,
    private readonly caregiverProfileService: CaregiverProfileService,
    private readonly addressService: AddressService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}
  async create(createBookingDto: CreateBookingDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        serviceType,
        date,
        startTime,
        duration,
        addressId,
        email,
        specialInstructions,
        emergencyContacts,
        caregiverId,
        userId,
        careRecipientDateOfBirth,
        careRecipientDetails,
      } = createBookingDto;

      const caregiver = await this.repository.validateCaregiverExists(
        queryRunner,
        caregiverId,
      );

      if (!caregiver) {
        throw new NotFoundException(
          BookingValidationMessage.CAREGIVER_NOT_FOUND,
        );
      }

      // Verify address exists and belongs to user
      const address = await this.addressService.findOne(addressId, userId);
      if (!address) {
        throw new NotFoundException(
          'Address not found or does not belong to user',
        );
      }

      const convertedDate = this.convertDateToISO(date);

      // Check if slot is available in caregiver's schedule
      const isSlotAvailable =
        await this.availabilitySlotService.isSlotAvailable(
          caregiverId,
          convertedDate, 
          startTime,
          Number(duration),
        );

      if (!isSlotAvailable) {
        throw new ConflictException(
          BookingErrorMessages.CAREGIVER_NOT_AVAILABLE,
        );
      }

      const overlappingBookings = await this.repository.findOverlappingBookings(
        caregiverId,
        convertedDate,
        startTime,
        Number(duration),
      );

      if (overlappingBookings.length > 0) {
        throw new ConflictException(
          BookingErrorMessages.BOOKING_ALREADY_EXISTS,
        );
      }

      const bookingData = {
        serviceType: serviceType.trim(),
        date: convertedDate,
        startTime: startTime,
        duration: Number(duration),
        addressId: addressId,
        email: email.trim(),
        specialInstructions: specialInstructions?.trim(),
        emergencyContacts,
        caregiverId: caregiverId,
        userId: userId,
        careRecipientDateOfBirth: careRecipientDateOfBirth,
        careRecipientDetails: careRecipientDetails,
        status: TransactionStatusMessage.PENDING,
        totalAmount: Number(caregiver.baseHourlyRate) * Number(duration),
      };

      const newBooking = await this.repository.createBookingWithQueryRunner(
        queryRunner,
        bookingData,
      );

      if (!newBooking) {
        throw new InternalServerErrorException(
          BookingErrorMessages.BOOKING_CREATION_FAILED,
        );
      }

      
      const backendUrl =
        this.configService.get<string>('BACKEND_URL') || BookingPlaceholder.DEFAULT_BACKEND_URL;

      const tran_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        total_amount: Number(caregiver.baseHourlyRate) * Number(duration),
        currency: BookingPaymentCurrency.BDT,
        tran_id: tran_id,
        success_url: `${backendUrl}${BookingPaymentUrl.SUCCESS}`,
        fail_url: `${backendUrl}${BookingPaymentUrl.FAIL}`,
        cancel_url: `${backendUrl}${BookingPaymentUrl.CANCEL}`,
        cus_name: BookingPlaceholder.USER_NAME,
        cus_email: email,
        cus_phone: BookingPlaceholder.DEFAULT_PHONE,
        cus_add1: 'House 12, Road 5, Dhanmondi',
        cus_city: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        ship_name: BookingPlaceholder.USER_NAME,
        ship_add1: 'House 12, Road 5, Dhanmondi',
        ship_city: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };

      const paymentRecord = queryRunner.manager.create(Payment, {
        bookingId: newBooking.id,
        userId: newBooking.userId,
        amount: Number(caregiver.baseHourlyRate) * Number(duration),
        currency: Currency.BDT,
        transactionId: tran_id,
        status: PaymentStatus.PENDING,
        paymentInitiatedAt: new Date(),
        caregiverPaymentStatus: CaregiverPaymentStatus.PENDING,
        paymentMethod: PaymentMethod.SSLCOMMERZ,
      });
const percentage = Number(this.configService.get<string>('PECENTAGE')) ;
const PlatformFee = paymentRecord.amount * percentage;
      await queryRunner.manager.save(paymentRecord);
paymentData.total_amount = paymentData.total_amount + PlatformFee;
      const paymentInitResponse =
        await this.sslCommerceService.initPayment(paymentData);

      await queryRunner.commitTransaction();

      let paymentUrl = paymentInitResponse.gateway_Url;
 if (!paymentUrl && paymentInitResponse.status === 'FAILED') {
        paymentUrl = `http://localhost:3001/bookings/payment/success?tran_id=${tran_id}&val_id=MOCK_VALIDATION`;
        this.logger.warn('SSLCommerz failed, using mock payment URL for testing', this.logTag);
      }
    this.logger.log(paymentInitResponse, this.logTag,"this is For The Payment Init Response Issue");
      return {
        booking: plainToInstance(BookingDto, newBooking, {
          excludeExtraneousValues: true,
        }),
        paymentUrl: paymentUrl,
        PlatformFee,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(BookingLogMessage.BOOKING_CREATION_FAILED_LOG, error, this.logTag);
      throw new InternalServerErrorException(
        BookingErrorMessages.BOOKING_CREATION_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private convertDateToISO(date: string): string {
    if (!date) return date;

   
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

   
    const dmyMatch = date.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return date;
  }

  async cancelbooking(
    bookingId: string,
    userId: string,
    cancelTimeDurationplicy: TimeDuration,
  ): Promise<ResponseBookingDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const booking = await this.repository.findBookingById(bookingId);
      if (!booking) {
        throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
      }
      const currentTime = new Date();
      const timeDiff = currentTime.getTime() - booking.createdAt.getTime();
      const diffInMinutes = Math.floor(timeDiff / (1000 * 60));
      if (diffInMinutes < cancelTimeDurationplicy) {
        throw new ConflictException(
          BookingErrorMessages.BOOKING_CANCELLATION_TIME_EXCEEDED,
        );
      }
      const bookingcancel = await this.repository.updateBookingStatus(
        queryRunner,
        bookingId,
        userId,
      );
      if (!bookingcancel) {
        throw new InternalServerErrorException(
          BookingErrorMessages.BOOKING_CANCELLATION_FAILED,
        );
      }
      await queryRunner.commitTransaction();
      return plainToInstance(
        ResponseBookingDto,
        {
          success: true,
          message: 'Booking cancelled successfully',
          timestamp: new Date().toISOString(),
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(BookingLogMessage.BOOKING_CANCELLATION_FAILED_LOG, error, this.logTag);
      throw new InternalServerErrorException(
        BookingErrorMessages.BOOKING_CANCELLATION_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getPreviousBookingDetails(bookingId: string, userId: string) {
    const previousBooking = await this.repository.findBookingById(bookingId);
    if (!previousBooking || previousBooking.userId !== userId) {
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    }
    return {
      serviceType: previousBooking.serviceType,
      date: previousBooking.date,
      startTime: previousBooking.startTime,
      duration: previousBooking.duration,
      addressId: previousBooking.addressId,
      email: previousBooking.email,
      specialInstructions: previousBooking.specialInstructions,
      emergencyContacts: previousBooking.emergencyContacts,
      userId: previousBooking.userId,
      caregiverId: previousBooking.caregiverId,
      careRecipientDateOfBirth: previousBooking.careRecipientDateOfBirth,
      careRecipientDetails: previousBooking.careRecipientDetails,
    };
  }

  async deleteBooking(
    bookingId: string,
    userId: string,
  ): Promise<ResponseBookingDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const booking = await this.repository.findBookingById(bookingId);
      if (!booking || booking.userId !== userId) {
        throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
      }
      const deletedBooking = await this.repository.softDeleteBooking(
        queryRunner,
        bookingId,
      );
      if (!deletedBooking) {
        throw new InternalServerErrorException(
          BookingErrorMessages.BOOKING_DELETION_FAILED,
        );
      }
      await queryRunner.commitTransaction();
      return plainToInstance(
        ResponseBookingDto,
        {
          success: true,
          message: 'Booking deleted successfully',
          timestamp: new Date().toISOString(),
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(BookingLogMessage.BOOKING_DELETION_FAILED_LOG, error, this.logTag);
      throw new InternalServerErrorException(
        BookingErrorMessages.BOOKING_DELETION_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getUserBookings(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string[],
  ) {
    const result = await this.repository.findAllBookings(
      userId,
      undefined,
      status,
      page,
      limit,
    );

    const transformedBookings = this.transformBookings(result.bookings);

    return {
      bookings: transformedBookings,
      total: result.total,
    };
  }

  async getCaregiverBookings(
    caregiverId: string,
    page: number = 1,
    limit: number = 10,
    status?: BookingStatus[],
  ) {
    const result = await this.repository.findAllBookings(
      undefined,
      caregiverId,
      status,
      page,
      limit,
    );

    const transformedBookings = this.transformBookings(result.bookings);

    return {
      bookings: transformedBookings,
      total: result.total,
    };
  }

  async getAllCaregiverBookings(
    caregiverId: string,
    status?: BookingStatus[],
  ) {
    const bookings = await this.repository.findByCaregiverId(caregiverId, status);
    const transformedBookings = this.transformBookings(bookings);
    return {
      bookings: transformedBookings,
      total: transformedBookings.length,
    };
  }

  async getAllBookings(page: number = 1, limit: number = 10) {
    try {
      const result = await this.repository.findAllBookings(
        undefined,
        undefined,
        undefined,
        page,
        limit,
      );
      const transformedBookings = this.transformBookings(result.bookings);
      return {
        success: true,
        bookings: transformedBookings,
        total: result.total,
      };
    } catch (error) {
      this.logger.error(BookingLogMessage.FAILED_TO_FETCH_ALL_BOOKINGS, error, this.logTag);
      throw new InternalServerErrorException(
        BookingValidationMessage.FAILED_TO_FETCH_BOOKINGS,
      );
    }
  }

  private transformBookings(bookings: Booking[]): any[] {
    return bookings.map(booking => {
      const transformedBooking: any = { ...booking };

      
      if (transformedBooking.user) {
        const { password, emergencyContacts, ...safeUserData } = transformedBooking.user;
        transformedBooking.user = safeUserData;
      }

     
      if (booking.caregiver && booking.caregiver.user) {
        const caregiverUserId = booking.caregiver.user.id;
        const { user, ...caregiverData } = booking.caregiver;
        
    
        const { password, emergencyContacts, ...safeCaregiverUserData } = user;
        
        transformedBooking.caregiver = {
          ...caregiverData,
          id: caregiverUserId,
          user: safeCaregiverUserData,
        };
      }

      return transformedBooking;
    });
  }

  
  async handlePaymentSuccess(tranId: string, valId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const payment = await queryRunner.manager.findOne(Payment, {
        where: { transactionId: tranId },
        relations: ['booking']
      });

      if (!payment || !payment.booking) {
        throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND_FOR_TRANSACTION);
      }

      let validationResponse;
      let isValidated = false;

      try {
        validationResponse = await this.sslCommerceService.transactionQuery(tranId);

     
        if (validationResponse.status === 'VALID' || validationResponse.status === 'VALIDATED') {
          isValidated = true;
        } else if (validationResponse.APIConnect === 'FAILED' || validationResponse.no_of_trans_found === 0) {
      
          isValidated = true; 
        }
      } catch (error) {
        isValidated = true;
      }

      if (isValidated) {
        const booking = payment.booking;

        booking.status = TransactionStatusMessage.CONFIRMED;
        booking.isPaid = true;
        booking.paidAmount = validationResponse?.amount || payment.amount;

        await queryRunner.manager.save(booking);

        payment.status = PaymentStatus.SUCCESSFUL;
        payment.paymentCompletedAt = new Date();
        await queryRunner.manager.save(payment);

        await queryRunner.commitTransaction();
        return {
          success: true,
          message: 'Payment confirmed and booking updated',
        };
      } else {
        throw new BadRequestException(
          BookingValidationMessage.PAYMENT_VALIDATION_FAILED,
        );
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(BookingLogMessage.PAYMENT_SUCCESS_HANDLING_FAILED, error, this.logTag);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handlePaymentFail(tranId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const bookingId = tranId;
      const booking = await this.repository.findBookingById(bookingId);
      if (booking) {
        booking.status = TransactionStatusMessage.CANCELLED;
        await queryRunner.manager.save(booking);
      }
      await queryRunner.commitTransaction();
      return { success: false, message: 'Payment failed, booking cancelled' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handlePaymentCancel(tranId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const bookingId = tranId;
      const booking = await this.repository.findBookingById(bookingId);
      if (booking) {
        booking.status = TransactionStatusMessage.CANCELLED;
        await queryRunner.manager.save(booking);
      }
      await queryRunner.commitTransaction();
      return {
        success: false,
        message: 'Payment cancelled, booking cancelled',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async clockIn(
    bookingId: string,
    caregiverId: string,
    lat?: number,
    lng?: number,
  ) {
    const booking = await this.repository.findBookingById(bookingId);
    if (!booking)
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    if (booking.caregiverId !== caregiverId)
      throw new BadRequestException(BookingValidationMessage.INVALID_CAREGIVER);
    if (booking.status !== TransactionStatusMessage.CONFIRMED)
      throw new BadRequestException(
        BookingConstraintMessage.BOOKING_MUST_BE_CONFIRMED_TO_CLOCK_IN,
      );

   
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException(BookingValidationMessage.LOCATION_REQUIRED);
    }

    const maxDistanceKm = Number(
      this.configService.get<string>('MAX_CLOCK_IN_DISTANCE_KM') ,
    );

    if (!booking.address || !booking.address.coordinates) {
      this.logger.error(
        BookingLogMessage.ADDRESS_COORDINATES_MISSING.replace(
          '{bookingId}',
          bookingId,
        ),
        this.logTag,
      );
      throw new BadRequestException(
        BookingValidationMessage.ADDRESS_LOCATION_MISSING,
      );
    }

    const destLat = booking.address.coordinates.lat;
    const destLng = booking.address.coordinates.lng;

    const distance = calculateDistance(lat, lng, destLat, destLng);

    if (distance > maxDistanceKm) {
      this.logger.warn(
        BookingLogMessage.DISTANCE_VALIDATION_FAILED.replace(
          '{caregiverId}',
          caregiverId,
        )
          .replace('{bookingId}', bookingId)
          .replace('{distance}', distance.toFixed(2))
          .replace('{limit}', maxDistanceKm.toString()),
        this.logTag,
      );
      throw new BadRequestException(
        BookingValidationMessage.DISTANCE_TOO_FAR.replace(
          '{maxDistance}',
          (maxDistanceKm * 1000).toString(),
        ).replace('{distance}', (distance * 1000).toFixed(0)),
      );
    }

    const activeBookings = await this.repository.findActiveClockedInBookings(
      caregiverId,
      'caregiver',
    );

    if (activeBookings.length > 0) {
      throw new BadRequestException(
        BookingConstraintMessage.CAREGIVER_ALREADY_CLOCKED_IN,
      );
    }

    booking.clockInTime = new Date();
    booking.status = TransactionStatusMessage.IN_PROGRESS;
    const savedBooking = await this.repository.save(booking);

   
    const caregiverName = booking.caregiver?.user
      ? `${booking.caregiver.user.firstName ?? ''} ${booking.caregiver.user.lastName ?? ''}`.trim()
      : 'Your caregiver';
    this.pushNotificationService
      .notifyCaregiversClockIn(
        booking.userId,
        caregiverName,
        caregiverId,
        bookingId,
        savedBooking.clockInTime!.toISOString(),
      )
      .catch((err) =>
        this.logger.error(
          BookingLogMessage.FAILED_TO_SEND_CLOCK_IN_NOTIFICATION,
          err,
          this.logTag,
        ),
      );

    return savedBooking;
  }

  async requestClockOut(bookingId: string, caregiverId: string, lat?: number, lng?: number) {
    const booking = await this.repository.findBookingById(bookingId);
    if (!booking)
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    if (booking.caregiverId !== caregiverId)
      throw new BadRequestException(BookingValidationMessage.INVALID_CAREGIVER);
    if (booking.status !== TransactionStatusMessage.IN_PROGRESS)
      throw new BadRequestException(
        BookingConstraintMessage.BOOKING_MUST_BE_IN_PROGRESS_TO_CLOCK_OUT,
      );

   
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException(
        BookingValidationMessage.LOCATION_REQUIRED_FOR_CLOCK_OUT,
      );
    }

    const maxDistanceKm = Number(
      this.configService.get<string>('MAX_CLOCK_OUT_DISTANCE_KM') ,
    );

    if (!booking.address || !booking.address.coordinates) {
      this.logger.error(
        BookingLogMessage.ADDRESS_COORDINATES_MISSING.replace(
          '{bookingId}',
          bookingId,
        ),
        this.logTag,
      );
      throw new BadRequestException(
        BookingValidationMessage.ADDRESS_LOCATION_MISSING_FOR_CLOCK_OUT,
      );
    }

    const destLat = booking.address.coordinates.lat;
    const destLng = booking.address.coordinates.lng;
    const distance = calculateDistance(lat, lng, destLat, destLng);

    if (distance > maxDistanceKm) {
      this.logger.warn(
        BookingLogMessage.CLOCK_OUT_DISTANCE_VALIDATION_FAILED.replace(
          '{caregiverId}',
          caregiverId,
        )
          .replace('{bookingId}', bookingId)
          .replace('{distance}', distance.toFixed(2))
          .replace('{limit}', maxDistanceKm.toString()),
        this.logTag,
      );
      throw new BadRequestException(
        BookingValidationMessage.DISTANCE_TOO_FAR_FOR_CLOCK_OUT.replace(
          '{maxDistance}',
          (maxDistanceKm * 1000).toString(),
        ).replace('{distance}', (distance * 1000).toFixed(0)),
      );
    }

    booking.proposedClockOutTime = new Date();
    const savedBooking = await this.repository.save(booking);

   
    const caregiverName = booking.caregiver?.user
      ? `${booking.caregiver.user.firstName ?? ''} ${booking.caregiver.user.lastName ?? ''}`.trim()
      : 'Your caregiver';
    this.pushNotificationService
      .notifyClockOutRequest(
        booking.userId,
        caregiverName,
        caregiverId,
        bookingId,
        savedBooking.proposedClockOutTime!.toISOString(),
      )
      .catch((err) =>
        this.logger.error(
          BookingLogMessage.FAILED_TO_SEND_CLOCK_OUT_REQUEST_NOTIFICATION,
          err,
          this.logTag,
        ),
      );

    return savedBooking;
  }


  async respondClockOut(
    bookingId: string,
    userId: string,
    action: 'accept' | 'decline',
  ) {
    const booking = await this.repository.findBookingById(bookingId);
    if (!booking)
      throw new NotFoundException(BookingValidationMessage.BOOKING_NOT_FOUND);
    if (booking.userId !== userId)
      throw new BadRequestException(BookingValidationMessage.INVALID_USER);

    if (!booking.clockInTime)
      throw new BadRequestException(
        BookingValidationMessage.CAREGIVER_MUST_CLOCK_IN_FIRST,
      );

    if (!booking.proposedClockOutTime)
      throw new BadRequestException(
        BookingValidationMessage.CAREGIVER_MUST_REQUEST_CLOCK_OUT_FIRST,
      );

    if (action === 'accept') {
      booking.clockOutTime = booking.proposedClockOutTime;
      booking.proposedClockOutTime = null;
      booking.status = TransactionStatusMessage.COMPLETED;

      await this.repository.save(booking);

      await this.sslCommerceService.processAutomatedPayout(booking.id);
    } else {
      booking.proposedClockOutTime = null;
      await this.repository.save(booking);
    }

  
    const caregiverUserId = booking.caregiver?.user?.id;
    const clientName = booking.user
      ? `${booking.user.firstName ?? ''} ${booking.user.lastName ?? ''}`.trim()
      : 'The client';
    if (caregiverUserId) {
      this.pushNotificationService
        .notifyClockOutResponse(
          caregiverUserId,
          action,
          bookingId,
          clientName,
          booking.userId,
        )
        .catch((err) =>
          this.logger.error(
            BookingLogMessage.FAILED_TO_SEND_CLOCK_OUT_RESPONSE_NOTIFICATION,
            err,
            this.logTag,
          ),
        );
    }

    return booking;
  }

  async getActiveClockedInBookings(user: JwtUser, bookingId?: string) {
    try {
      let bookings: Booking[] = [];
      
      
      this.logger.log(`Checking active bookings for user: ${user.userId}, Roles: ${JSON.stringify(user.roles)}`, this.logTag);
      
      
      const isCaregiver = user.roles.some(role => 
        role.toLowerCase() === UserRole.CAREGIVER.toLowerCase()
      );

      if (isCaregiver) {
        try {
        
          const profile = await this.caregiverProfileService.findByUserId(
            user.userId,
          );
         
          bookings = await this.repository.findActiveClockedInBookings(
            profile.id,
            'caregiver',
            bookingId,
          );
        } catch (error) {
          
          this.logger.warn(
            `Caregiver profile not found for user ${user.userId}`,
            this.logTag,
          );
        }
      } else {
        
        bookings = await this.repository.findActiveClockedInBookings(
          user.userId,
          'client',
          bookingId,
        );
      }

      return {
        success: true,
        data: bookings,
        count: bookings.length,
      };
    } catch (error) {
      this.logger.error(
        BookingLogMessage.FAILED_TO_FETCH_ACTIVE_CLOCKED_IN_BOOKINGS,
        error,
        this.logTag,
      );
      throw new InternalServerErrorException(
        BookingErrorMessage.FAILED_TO_FETCH_ACTIVE_CLOCKED_IN_BOOKINGS,
      );
    }
  }
}
