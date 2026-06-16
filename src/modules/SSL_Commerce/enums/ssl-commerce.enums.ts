export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum CaregiverPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export enum Currency {
  BDT = 'BDT',
  USD = 'USD',
}

export enum PaymentMethod {
  SSLCOMMERZ = 'SSLCommerz',
  CARD = 'card',
  MOBILE_BANKING = 'mobile_banking',
  BANK_TRANSFER = 'bank_transfer',
  MOCK_BANK_TRANSFER = 'MOCK_BANK_TRANSFER',
}

export enum SSLCommerzStatus {
  VALID = 'VALID',
  VALIDATED = 'VALIDATED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ProductCategory {
  SERVICE = 'Service',
  CAREGIVER_SERVICE = 'Caregiver Service',
}

export enum ShippingMethod {
  COURIER = 'Courier',
  PICKUP = 'Pickup',
}

export enum ProductProfile {
  GENERAL = 'general',
  PHYSICAL_GOODS = 'physical-goods',
  NON_PHYSICAL_GOODS = 'non-physical-goods',
  AIRLINE_TICKETS = 'airline-tickets',
  TRAVEL_VERTICAL = 'travel-vertical',
  TELECOM_VERTICAL = 'telecom-vertical',
}

export enum ApiOperationSummary {
  INIT_BOOKING_PAYMENT = 'Initialize payment for a booking',
  GET_COMPLETED_BOOKINGS = 'Get completed bookings for admin payout',
  PAY_CAREGIVER = 'Admin pays caregiver for a completed booking',
  PAYMENT_SUCCESS_CALLBACK = 'Payment success callback',
  PAYMENT_FAIL_CALLBACK = 'Payment fail callback',
  PAYMENT_CANCEL_CALLBACK = 'Payment cancel callback',

  VALIDATE_PAYMENT = 'Validate payment using validation ID',
  QUERY_TRANSACTION_STATUS = 'Query transaction status',
}

export enum ApiResponseDescription {
  PAYMENT_INITIALIZED = 'Payment initialized successfully',
  CAREGIVER_PAID = 'Caregiver paid successfully',
  PAYMENT_SUCCESS_PROCESSED = 'Payment success processed',
  PAYMENT_FAILURE_PROCESSED = 'Payment failure processed',
  PAYMENT_CANCELLATION_PROCESSED = 'Payment cancellation processed',

  PAYMENT_VALIDATED = 'Payment validated successfully',
  TRANSACTION_STATUS_RETRIEVED = 'Transaction status retrieved',
}

export enum SwaggerExample {
  BOOKING_UUID = 'booking-uuid',
  TRANSACTION_ID = 'trans-id',

  VALIDATION_ID = 'validation-id',
  TRANSACTION_ID_EXAMPLE = 'transaction-id',
}

export enum PaymentMessage {
  PAYMENT_FAILED = 'Payment failed',
  PAYMENT_CANCELLED = 'Payment cancelled',
}

export enum SSLCommerceErrorMessage {
  BOOKING_NOT_FOUND = 'Booking not found',
  PAYMENT_RECORD_NOT_FOUND = 'Payment record not found for this booking',
  BOOKING_NOT_COMPLETED = 'Booking is not completed yet',
  CAREGIVER_ALREADY_PAID = 'Caregiver already paid',
  PAYMENT_NOT_FOUND = 'Payment not found',
}
export interface PaymentData {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  shipping_method?: string;
  product_name?: string;
  product_category?: string;
  product_profile?: string;
  cus_name: string;
  cus_email: string;
  cus_add1?: string;
  cus_add2?: string;
  cus_city?: string;
  cus_state?: string;
  cus_postcode?: string;
  cus_country?: string;
  cus_phone: string;
  cus_fax?: string;
  ship_name?: string;
  ship_add1?: string;
  ship_add2?: string;
  ship_city?: string;
  ship_state?: string;
  ship_postcode?: number;
  ship_country?: string;
}
