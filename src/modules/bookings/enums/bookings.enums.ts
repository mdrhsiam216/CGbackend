export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BookingValidationMessage {
  USER_ID_REQUIRED = 'User ID is required',
  CAREGIVER_ID_REQUIRED = 'Caregiver ID is required',
  BOOKING_ID_AND_USER_ID_REQUIRED = 'Booking ID and User ID are required',
  CAREGIVER_NOT_FOUND = 'Caregiver not found',
  USER_NOT_FOUND = 'User not found',
  BOOKING_NOT_FOUND = 'Booking not found',
  BOOKING_NOT_FOUND_FOR_TRANSACTION = 'Booking not found for transaction',
  INVALID_CAREGIVER = 'Invalid caregiver',
  INVALID_USER = 'Invalid user',
  NO_PENDING_CLOCK_OUT_REQUEST = 'No pending clock out request',
  CAREGIVER_MUST_CLOCK_IN_FIRST = 'Caregiver must clock in before requesting clock out',
  CAREGIVER_MUST_REQUEST_CLOCK_OUT_FIRST = 'Caregiver must request clock out before client can respond',
  PAYMENT_VALIDATION_FAILED = 'Payment validation failed',
  FAILED_TO_FETCH_BOOKINGS = 'Failed to fetch bookings',
  LOCATION_REQUIRED = 'Location access is required. Please enable GPS and allow the app to access your location to clock in.',
  ADDRESS_LOCATION_MISSING = 'This booking address is missing location data. Please contact support to resolve this issue.',
  DISTANCE_TOO_FAR = 'You must be within {maxDistance} meters of the booking location to clock in. Current distance: {distance} meters.',
  LOCATION_REQUIRED_FOR_CLOCK_OUT = 'Location access is required. Please enable GPS and allow the app to access your location to clock out.',
  ADDRESS_LOCATION_MISSING_FOR_CLOCK_OUT = 'This booking address is missing location data. Cannot verify clock-out location.',
  DISTANCE_TOO_FAR_FOR_CLOCK_OUT = 'You must be within {maxDistance} meters of the booking location to clock out. Current distance: {distance} meters.',
}

export enum BookingOperationMessage {
  BOOKING_CANCELLED_SUCCESSFULLY = 'Booking cancelled successfully',
  BOOKING_DELETED_SUCCESSFULLY = 'Booking deleted successfully',
  PAYMENT_CONFIRMED_AND_BOOKING_UPDATED = 'Payment confirmed and booking updated',
  PAYMENT_FAILED_BOOKING_CANCELLED = 'Payment failed, booking cancelled',
  PAYMENT_CANCELLED_BOOKING_CANCELLED = 'Payment cancelled, booking cancelled',
}

export enum BookingConstraintMessage {
  BOOKING_MUST_BE_CONFIRMED_TO_CLOCK_IN = 'Booking must be confirmed to clock in',
  BOOKING_MUST_BE_IN_PROGRESS_TO_CLOCK_OUT = 'Booking must be in progress to clock out',
  CAREGIVER_ALREADY_CLOCKED_IN = 'Caregiver already has an active clocked-in booking',
}

export enum BookingApiOperation {
  CAREGIVER_CLOCK_IN = 'Caregiver Clock In',
  CAREGIVER_REQUEST_CLOCK_OUT = 'Caregiver Request Clock Out',
  CLIENT_RESPOND_TO_CLOCK_OUT_REQUEST = 'Client Respond to Clock Out Request',
}

export enum BookingApiDescription {
  CURRENT_PAGE_NUMBER = 'Current page number',
  ITEMS_PER_PAGE = 'Number of items per page',
  TOTAL_ITEMS = 'Total number of items',
  TOTAL_PAGES = 'Total number of pages',
  HAS_NEXT_PAGE = 'Whether there is a next page',
  HAS_PREVIOUS_PAGE = 'Whether there is a previous page',
  ARRAY_OF_BOOKINGS = 'Array of bookings',
  PAGINATION_METADATA = 'Pagination metadata',
  HTTP_STATUS_CODE = 'HTTP status code',
  ERROR_MESSAGE = 'Error message',
  ERROR_TYPE = 'Error type',
  SUCCESS_STATUS = 'Success status',
  SUCCESS_MESSAGE = 'Success message',
  ID_OF_USER = 'ID of the user',
  PAGE_NUMBER = 'Page number',
  ITEMS_PER_PAGE_QUERY = 'Items per page',
  ID_OF_USER_CREATING_BOOKING = 'ID of the user creating the booking',
  ID_OF_BOOKING_TO_CANCEL = 'ID of the booking to cancel',
  ID_OF_USER_REQUESTING_CANCELLATION = 'ID of the user requesting cancellation',
  ID_OF_PREVIOUS_BOOKING = 'ID of the previous booking',
  ID_OF_CAREGIVER = 'ID of the caregiver',
  ID_OF_BOOKING_TO_DELETE = 'ID of the booking to delete',
  ID_OF_USER_REQUESTING_DELETION = 'ID of the user requesting deletion',
}

export const BookingApiExampleValues = {
  PAGE_1: 1,
  LIMIT_10: 10,
  STATUS_CODE_400: 400,
  TOTAL_100: 100,
  TOTAL_PAGES_10: 10,
  HAS_NEXT_TRUE: true,
  HAS_PREV_FALSE: false,
  SUCCESS_TRUE: true,
  DURATION_4_HOURS: 4,
} as const;

export enum BookingApiExampleStrings {
  USER_ID_REQUIRED = 'User ID is required',
  ERROR_BAD_REQUEST = 'Bad Request',
  OPERATION_COMPLETED_SUCCESSFULLY = 'Operation completed successfully',
  UUID_EXAMPLE = 'uuid',
}

export enum BookingClockAction {
  ACCEPT = 'accept',
  DECLINE = 'decline',
}

export enum PaymentValidationStatus {
  VALID = 'VALID',
  VALIDATED = 'VALIDATED',
}

export enum BookingPaymentCurrency {
  BDT = 'BDT',
}

export enum BookingPaymentUrl {
  SUCCESS = '/bookings/payment/success',
  FAIL = '/bookings/payment/fail',
  CANCEL = '/bookings/payment/cancel',
}

export enum BookingTodoComment {
  CALCULATE_ACTUAL_AMOUNT = 'TODO: Calculate actual amount based on service/duration',
  FETCH_USER_DETAILS = 'TODO: Fetch user details',
  FETCH_USER_PHONE = 'TODO: Fetch user phone',
}

export enum BookingPlaceholder {
  USER_NAME = 'User Name',
  DEFAULT_PHONE = '01700000000',
  DEFAULT_BACKEND_URL = 'http://localhost:3001',
}

export enum BookingLogMessage {
    BOOKING_CREATION_FAILED_LOG = 'Booking creation failed',
    BOOKING_CANCELLATION_FAILED_LOG = 'Booking cancellation failed',
    BOOKING_DELETION_FAILED_LOG = 'Booking deletion failed',
    FAILED_TO_FETCH_ALL_BOOKINGS = 'Failed to fetch all bookings',
    FAILED_TO_FETCH_BOOKINGS = 'Failed to fetch bookings',
    PAYMENT_SUCCESS_HANDLING_FAILED = 'Payment success handling failed',
    PAYMENT_VALIDATION_FAILED = 'Payment validation failed',
    FAILED_TO_FETCH_ACTIVE_CLOCKED_IN_BOOKINGS = 'Failed to fetch active clocked-in bookings',
    ADDRESS_COORDINATES_MISSING = 'Booking {bookingId} has no address coordinates. Cannot validate distance.',
    DISTANCE_VALIDATION_FAILED = 'Caregiver {caregiverId} too far from booking {bookingId}. Distance: {distance}km, Limit: {limit}km',
    FAILED_TO_SEND_CLOCK_IN_NOTIFICATION = 'Failed to send clock-in notification',
    FAILED_TO_SEND_CLOCK_OUT_REQUEST_NOTIFICATION = 'Failed to send clock-out request notification',
    FAILED_TO_SEND_CLOCK_OUT_RESPONSE_NOTIFICATION = 'Failed to send clock-out response notification',
    CLOCK_OUT_DISTANCE_VALIDATION_FAILED = 'Caregiver {caregiverId} too far from booking {bookingId} on clock-out. Distance: {distance}km, Limit: {limit}km',
}

export enum BookingDtoDescription {
  TYPE_OF_SERVICE_REQUIRED = 'Type of service required',
  DATE_IN_DD_MM_YYYY_FORMAT = 'Date of the booking in DD/MM/YYYY format',
  START_TIME_IN_HH_MM_FORMAT = 'Start time of the booking in HH:MM format',
  DURATION_IN_HOURS = 'Duration of the booking in hours',
  LOCATION_OF_SERVICE = 'Location of the service',
  EMAIL_FOR_CONTACT = 'Email address for contact',
  SPECIAL_INSTRUCTIONS = 'Special instructions for the caregiver',
  EMERGENCY_CONTACTS = 'Emergency contacts',
  ID_OF_CAREGIVER = 'ID of the caregiver',
  ID_OF_USER_MAKING_BOOKING = 'ID of the user making the booking',
  ID_OF_PREVIOUS_BOOKING_TO_REBOOK = 'ID of the previous booking to rebook from',
  NEW_DATE_FOR_REBOOKING = 'New date for the rebooking in DD/MM/YYYY format',
  NEW_START_TIME_FOR_REBOOKING = 'New start time for the rebooking in HH:MM format',
}

export enum BookingDtoExampleStrings {
  ELDERLY_CARE = 'Elderly Care',
  DATE_25_12_2025 = '25/12/2025',
  TIME_09_00 = '09:00',
  LOCATION_EXAMPLE = '123 Main St, New York, NY',
  EMAIL_EXAMPLE = 'user@example.com',
  SPECIAL_INSTRUCTIONS_EXAMPLE = 'Please bring your own lunch.',
  UUID_EXAMPLE = '123e4567-e89b-12d3-a456-426614174000',
  DATE_26_12_2025 = '26/12/2025',
  TIME_10_00 = '10:00',
}

export const BookingDtoExampleNumbers = {
  DURATION_4_HOURS: 4,
  MINIMUM_DURATION: 1,
} as const;

export enum BookingDtoValidationMessage {
  DATE_MUST_BE_DD_MM_YYYY = 'date must be in DD/MM/YYYY format',
  START_TIME_MUST_BE_HH_MM = 'startTime must be in HH:MM format',
}

export enum BookingDtoPattern {
  DATE_PATTERN = '^\\d{2}\\/\\d{2}\\/\\d{4}$',
  TIME_PATTERN = '^\\d{2}:\\d{2}$',
}

export enum BookingSuccessMessage {
    ACTIVE_CLOCKED_IN_BOOKINGS_RETRIEVED = 'Active clocked-in bookings retrieved successfully',
}

export enum BookingErrorMessage {
    FAILED_TO_FETCH_ACTIVE_CLOCKED_IN_BOOKINGS = 'Failed to fetch active clocked-in bookings',
}

export enum BookingApiOperationSummary {
    GET_USER_ACTIVE_CLOCKED_IN_BOOKINGS = 'Get user\'s active clocked-in bookings',
}

export enum BookingApiOperationDescription {
    GET_ACTIVE_CLOCKED_IN_BOOKINGS = 'Retrieves all bookings for a specific user where caregivers have clocked in but have not clocked out yet',
    USER_ID_FOR_ACTIVE_CLOCKED_IN = 'ID of the user to get active clocked-in bookings for',
}
