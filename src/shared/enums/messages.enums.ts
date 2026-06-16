export const enum CommonErrorMessages {
  SOMETHING_WENT_WRONG = 'An unexpected error occurred. Please try again later.',
  TOO_MANY_REQUESTS = 'You have made too many requests. Please wait a moment before trying again.',
  NO_DATA_FOUND = 'No data found for your request.',
  COULD_NOT_UPLOAD_MEDIA = 'Failed to upload media. Please try again.',
  COULD_NOT_DELETE_MEDIA = 'Could not delete media',
}

export const enum S3ErrorMessages {
  AWS_S3_CONFIGURATION_INCOMPLETE = 'AWS S3 configuration is incomplete.',
  AWS_S3_CONFIGURATION_MISSING_ENV_VARS = 'AWS S3 configuration is incomplete. Missing required environment variables.',
  FILE_NAME_AND_CONTENT_TYPE_REQUIRED = 'File name and content type are required when uploading a Buffer.',
  FILE_UPLOAD_FAILED = 'Failed to upload file to S3.',
  FILE_DELETE_FAILED = 'Failed to delete file from S3.',
  PRESIGNED_URL_GENERATION_FAILED = 'Failed to generate presigned URL.',
}

export enum S3LogMessages {
  AWS_S3_SERVICE_INITIALIZED = 'AWS S3 service initialized',
  UPLOADING_FILE_TO_S3 = 'Uploading file to S3',
  FILE_UPLOADED_SUCCESSFULLY = 'File uploaded successfully',
  DELETING_FILE_FROM_S3 = 'Deleting file from S3',
  FILE_DELETED_SUCCESSFULLY = 'File deleted successfully',
  GENERATED_PRESIGNED_URL = 'Generated presigned URL',
}
export const enum UnauthorizedErrorMessages {
  ACCOUNT_INACTIVE = 'Your account is inactive. Please contact support.',
  INVALID_USER = 'The provided user credentials are invalid.',
  ACTION_RESTRICTED = 'You are not authorized to perform this action.',
  INVALID_REFRESH_TOKEN = 'The refresh token is invalid or has expired. Please log in again.',
  ROLE_ID_REQUIRED = 'Role ID is required for login.',
  INVALID_ROLE_ID = 'Invalid role ID provided.',
  USER_DOES_NOT_HAVE_ROLE = 'User does not have the requested role. Please login with a role assigned to your account.',
  ROLE_NOT_FOUND = 'Role not found.',
  USER_HAS_NO_ROLES = 'User has no roles assigned.',
}

// Common API Response Descriptions for Swagger
export const enum ApiResponseDescriptions {
  // 400 Bad Request
  BAD_REQUEST = 'Bad request',
  INVALID_DATA = 'Invalid data provided',
  INVALID_REQUEST_DATA = 'Invalid request data',
  REQUIRED_FIELD_MISSING = 'Required field is missing',

  // 401 Unauthorized
  UNAUTHORIZED = 'Unauthorized',
  UNAUTHORIZED_ACCESS = 'Unauthorized access',
  INVALID_CREDENTIALS = 'Invalid credentials',
  INVALID_TOKEN = 'Invalid or expired token',
  INVALID_REFRESH_TOKEN = 'Invalid or expired refresh token',

  // 403 Forbidden
  FORBIDDEN = 'Forbidden',
  ACCESS_DENIED = 'Access denied',

  // 404 Not Found
  NOT_FOUND = 'Not found',
  USER_NOT_FOUND = 'User not found',
  RESOURCE_NOT_FOUND = 'Resource not found',

  // 409 Conflict
  CONFLICT = 'Conflict',
  ALREADY_EXISTS = 'Resource already exists',
  EMAIL_ALREADY_IN_USE = 'Email already in use',
}

// Module-specific API Response Descriptions
export const enum AuthApiResponseDescriptions {
  INVALID_OTP = 'Invalid OTP',
  INVALID_OTP_OR_PASSWORD = 'Invalid OTP or password format',
  USER_ALREADY_EXISTS = 'Invalid data or user already exists',
}

export const enum BookingApiResponseDescriptions {
  USER_ID_REQUIRED = 'User ID is required',
  CAREGIVER_ID_REQUIRED = 'Caregiver ID is required',
  BOOKING_ID_REQUIRED = 'Booking ID is required',
  INVALID_BOOKING_ID_OR_USER_ID = 'Invalid booking ID or user ID',
  BOOKING_AND_USER_ID_REQUIRED = 'Booking ID and User ID are required',
  INVALID_REBOOKING_DATA = 'Invalid rebooking data',
  BOOKING_NOT_FOUND = 'Booking not found',
  PREVIOUS_BOOKING_NOT_FOUND = 'Previous booking not found',
  CAREGIVER_NOT_FOUND = 'Caregiver not found',
  USER_NOT_AUTHORIZED_TO_CANCEL = 'User is not authorized to cancel this booking',
  USER_NOT_AUTHORIZED_TO_DELETE = 'User is not authorized to delete this booking',
  ADMIN_ACCESS_REQUIRED = 'Admin access required',
}

export const enum UserRoleApiResponseDescriptions {
  INVALID_ROLE_DATA = 'Invalid role data',
}

export const enum RoleApiResponseDescriptions {
  ROLE_NAME_REQUIRED = 'Role name is required',
  INVALID_ROLE_ID = 'Invalid role ID',
  ROLE_NOT_FOUND = 'Role not found',
}

export const enum UserApiResponseDescriptions {
  INVALID_USER_DATA = 'Invalid user data',
  INVALID_PASSWORD = 'Invalid password format',
  INVALID_STATUS = 'Invalid status value',
}

export const enum ClientProfileApiResponseDescriptions {
  INVALID_PROFILE_DATA = 'Invalid profile data',
  PROFILE_NOT_FOUND = 'Profile not found',
  CLIENT_PROFILE_NOT_FOUND = 'Client profile not found',
}

export const enum CaregiverProfileApiResponseDescriptions {
  INVALID_PROFILE_DATA = 'Invalid profile data',
  PROFILE_NOT_FOUND = 'Profile not found',
  CAREGIVER_PROFILE_NOT_FOUND = 'Caregiver profile not found',
  INVALID_VERIFICATION_DATA = 'Invalid verification data',
}

export const enum CertificateApiResponseDescriptions {
  INVALID_CERTIFICATE_DATA = 'Invalid certificate data',
  CERTIFICATE_NOT_FOUND = 'Certificate not found',
  INVALID_CERTIFICATE_FILE = 'Invalid certificate file',
  CERTIFICATE_FILE_REQUIRED = 'Certificate file is required',
}

export const enum AddressApiResponseDescriptions {
  INVALID_ADDRESS_DATA = 'Invalid address data',
  ADDRESS_NOT_FOUND = 'Address not found',
  ADDRESS_ID_REQUIRED = 'Address ID is required',
}

export const enum AvailabilitySlotApiResponseDescriptions {
  INVALID_SLOT_DATA = 'Invalid availability slot data',
  SLOT_NOT_FOUND = 'Availability slot not found',
  CAREGIVER_ID_REQUIRED = 'Caregiver ID is required',
  INVALID_DATE_RANGE = 'Invalid date range',
}

export const enum ChatApiResponseDescriptions {
  CONVERSATION_NOT_FOUND = 'Conversation not found',
  MESSAGE_NOT_FOUND = 'Message not found',
  INVALID_MESSAGE_DATA = 'Invalid message data',
}

export const enum AuthErrorMessages {
  OTP_RESEND_COOLDOWN = 'Please wait {minutes} minutes before requesting a new OTP.',
  FAILED_TO_SEND_VERIFICATION_EMAIL = 'Failed to send verification email.',
  FAILED_TO_SEND_PASSWORD_RESET_EMAIL = 'Failed to send password reset email.',
  FAILED_TO_SEND_VERIFICATION_SMS = 'Failed to send verification SMS. Please try again.',
  FAILED_TO_SEND_PASSWORD_RESET_SMS = 'Failed to send password reset SMS. Please try again.',
  FAILED_TO_SEND_VERIFICATION_OTP = 'Failed to send verification OTP. Please try again later.',
  FAILED_TO_ACTIVATE_ACCOUNT = 'Failed to activate account. Please try again.',
  PHONE_NOT_VERIFIED = 'Phone number is not verified. Please verify your phone number first.',
  EMAIL_OR_PHONE_REQUIRED = 'Either email or phone is required.',
  INVALID_OTP = 'Invalid or expired OTP.',
  OTP_EXPIRED = 'OTP has expired.',
  EMAIL_ALREADY_VERIFIED = 'Email already verified.',
  ACCOUNT_NOT_ACTIVE = 'Account is not active.',
}

export enum AuthLogMessages {
  FAILED_TO_SEND_VERIFICATION_OTP_SMS = 'Failed to send verification OTP SMS',
  PHONE_VERIFICATION_OTP_SENT = 'Phone verification OTP sent',
  INVALID_SMS_OTP_ATTEMPTED = 'Invalid SMS OTP attempted',
  EXPIRED_SMS_OTP_ATTEMPTED = 'Expired SMS OTP attempted',
  PHONE_OTP_VERIFIED_SUCCESSFULLY = 'Phone OTP verified successfully',
  FAILED_TO_SEND_PASSWORD_RESET_OTP_SMS = 'Failed to send password reset OTP SMS',
  PASSWORD_RESET_OTP_SENT = 'Password reset OTP sent',
}

export const enum AuthSuccessMessages {
  LOGIN_SUCCESSFUL = 'LOGIN_SUCCESSFUL',
  USER_REGISTERED_SUCCESSFULLY = 'USER_REGISTERED_SUCCESSFULLY',
  PHONE_VERIFIED_SUCCESSFULLY = 'PHONE_VERIFIED_SUCCESSFULLY',
  VERIFICATION_OTP_SENT_SUCCESSFULLY = 'VERIFICATION_OTP_SENT_SUCCESSFULLY',
  PASSWORD_RESET_OTP_SENT = 'PASSWORD_RESET_OTP_SENT',
  PASSWORD_RESET_SUCCESSFULLY = 'PASSWORD_RESET_SUCCESSFULLY',
  TOKENS_REFRESHED_SUCCESSFULLY = 'TOKENS_REFRESHED_SUCCESSFULLY',
  LOGOUT_SUCCESSFUL = 'LOGOUT_SUCCESSFUL',
  LOGGED_OUT_FROM_ALL_DEVICES = 'LOGGED_OUT_FROM_ALL_DEVICES',
  PROFILE_RETRIEVED_SUCCESSFULLY = 'PROFILE_RETRIEVED_SUCCESSFULLY',
  ACTIVE_SESSIONS_RETRIEVED = 'ACTIVE_SESSIONS_RETRIEVED',
}

export const enum AuthResponseMessages {
  PHONE_VERIFIED = 'Phone verified successfully. Your account is now active.',
  VERIFICATION_OTP_SENT = 'Verification OTP sent to your phone successfully',
  PASSWORD_RESET_OTP_SENT = 'If a user with that phone number exists, a password reset OTP has been sent via SMS.',
  PASSWORD_RESET = 'Password reset successfully',
  TOKENS_REFRESHED = 'Tokens refreshed successfully',
  LOGOUT = 'Logout successful',
  LOGGED_OUT_ALL_DEVICES = 'Logged out from all devices successfully',
}

export const enum UserErrorMessages {
  USER_NOT_FOUND = 'User not found.',
  EMAIL_ALREADY_EXISTS = 'Email is already in use.',
  PHONE_ALREADY_EXISTS = 'Phone number is already in use.',
  INVALID_CREDENTIALS = 'Invalid email or password.',
  USER_STATUS_INVALID = 'Invalid user status.',
  USER_CREATION_FAILED = 'Failed to create user.',
  USER_UPDATE_FAILED = 'Failed to update user.',
  USER_DELETION_FAILED = 'Failed to delete user.',
  USER_FETCH_FAILED = 'Failed to fetch user',
  FAILED_TO_FETCH_USER_BY_EMAIL = 'Failed to fetch user by email',
  FAILED_TO_FETCH_USER_BY_PHONE = 'Failed to fetch user by phone',
  FAILED_TO_FETCH_USER_TOTAL_PAYMENT_AMOUNT = 'Failed to fetch user total payment amount',
  PASSWORD_NOT_BE_SAME = 'New password cannot be the same as the current password.',
  AVATAR_DELETION_FAILED = 'Failed to delete old avatar.',
}
export const enum RoleErrorMessages {
  ROLE_NOT_FOUND = 'Role not found.',
  ROLE_ALREADY_EXISTS = 'Role name already exists.',
  ROLE_CREATION_FAILED = 'Failed to create role.',
  ROLE_UPDATE_FAILED = 'Failed to update role.',
  ROLE_DELETION_FAILED = 'Failed to delete role.',
  ROLE_ASSIGN_FAILED = 'Failed to assign roles',
  ROLE_ID_INVALID = 'Role Id is invalid',
  ROLE_FETCH_FAILED = 'Failed to fetch roles',
  ROLE_ASSIGNED_TO_USERS = 'Cannot delete role that is assigned to users.',
}
export const enum UserRoleErrorMessages {
  USER_ROLE_NOT_FOUND = 'User role assignment not found.',
  USER_ROLE_ALREADY_ASSIGNED = 'User already has this role.',
  USER_ROLE_ASSIGN_FAILED = 'Failed to assign role to user.',
  USER_ROLE_REMOVE_FAILED = 'Failed to remove role from user.',
}
export const enum ClientProfileErrorMessages {
  CLIENT_PROFILE_NOT_FOUND = 'Client profile not found.',
  CLIENT_PROFILE_ALREADY_EXISTS = 'Client profile already exists for this user.',
  INVALID_HOME_LOCATION = 'Invalid home location provided.',
  CLIENT_PROFILE_CREATION_FAILED = 'Failed to create client profile.',
  CLIENT_PROFILE_UPDATE_FAILED = 'Failed to update client profile.',
  CLIENT_PROFILE_DELETION_FAILED = 'Failed to delete client profile.',
}
export const enum EmergencyContactErrorMessages {
  EMERGENCY_CONTACT_NOT_FOUND = 'Emergency contact not found.',
  EMERGENCY_CONTACT_CREATION_FAILED = 'Failed to create emergency contact.',
  EMERGENCY_CONTACT_UPDATE_FAILED = 'Failed to update emergency contact.',
  EMERGENCY_CONTACT_DELETION_FAILED = 'Failed to delete emergency contact.',
  INVALID_RELATION = 'Invalid relation type for emergency contact.',
  MAX_PRIMARY_CONTACTS_EXCEEDED = 'Only one primary emergency contact allowed.',
}
export const enum CaregiverProfileErrorMessages {
  CAREGIVER_PROFILE_NOT_FOUND = 'Caregiver profile not found.',
  CAREGIVER_PROFILE_ALREADY_EXISTS = 'Caregiver profile already exists for this user.',
  INVALID_BASE_HOURLY_RATE = 'Invalid base hourly rate.',
  INVALID_SERVICE_AREA = 'Invalid service area provided.',
  INVALID_HOME_LOCATION = 'Invalid home location provided.',
  CAREGIVER_PROFILE_CREATION_FAILED = 'Failed to create caregiver profile.',
  CAREGIVER_PROFILE_UPDATE_FAILED = 'Failed to update caregiver profile.',
  CAREGIVER_PROFILE_DELETION_FAILED = 'Failed to delete caregiver profile.',
}
export const enum VerificationCheckErrorMessages {
  VERIFICATION_CHECK_NOT_FOUND = 'Verification check not found.',
  INVALID_VERIFICATION_TYPE = 'Invalid verification type.',
  INVALID_VERIFICATION_STATUS = 'Invalid verification status.',
  VERIFICATION_CHECK_CREATION_FAILED = 'Failed to create verification check.',
  VERIFICATION_CHECK_UPDATE_FAILED = 'Failed to update verification check.',
  VERIFICATION_CHECK_DELETION_FAILED = 'Failed to delete verification check.',
}
export const enum CertificationErrorMessages {
  CERTIFICATION_NOT_FOUND = 'Certification not found.',
  INVALID_CERTIFICATION_STATUS = 'Invalid certification status.',
  CERTIFICATION_EXPIRED = 'Certification has expired.',
  INVALID_ISSUED_DATE = 'Invalid issued date for certification.',
  INVALID_EXPIRY_DATE = 'Invalid expiry date for certification.',
  CERTIFICATION_CREATION_FAILED = 'Failed to create certification.',
  CERTIFICATION_UPDATE_FAILED = 'Failed to update certification.',
  CERTIFICATION_DELETION_FAILED = 'Failed to delete certification.',
}
export const enum CertificateErrorMessages {
  CERTIFICATE_NOT_FOUND = 'Certificate not found.',
  INVALID_CERTIFICATE_STATUS = 'Invalid certificate status.',
  CERTIFICATE_CREATION_FAILED = 'Failed to create certificate.',
  CERTIFICATE_UPDATE_FAILED = 'Failed to update certificate.',
  CERTIFICATE_DELETION_FAILED = 'Failed to delete certificate.',
  CERTIFICATE_UPLOAD_FAILED = 'Failed to upload certificate file.',
  CERTIFICATE_FILE_REQUIRED = 'Certificate file is required.',
  INVALID_CERTIFICATE_FILE_TYPE = 'Invalid certificate file type. Only PDF, JPG, JPEG, PNG are allowed.',
  CERTIFICATE_FILE_SIZE_EXCEEDED = 'Certificate file size exceeds the maximum allowed size (5MB).',
}
export const enum ServiceTypeErrorMessages {
  SERVICE_TYPE_NOT_FOUND = 'Service type not found.',
  SERVICE_TYPE_ALREADY_EXISTS = 'Service type name already exists.',
  INVALID_MIN_HOURS = 'Invalid minimum hours for service type.',
  SERVICE_TYPE_CREATION_FAILED = 'Failed to create service type.',
  SERVICE_TYPE_UPDATE_FAILED = 'Failed to update service type.',
  SERVICE_TYPE_DELETION_FAILED = 'Failed to delete service type.',
}
export const enum CaregiverServiceErrorMessages {
  CAREGIVER_SERVICE_NOT_FOUND = 'Caregiver service not found.',
  CAREGIVER_SERVICE_ALREADY_OFFERED = 'Caregiver already offers this service type.',
  INVALID_HOURLY_RATE = 'Invalid hourly rate for service.',
  CAREGIVER_SERVICE_CREATION_FAILED = 'Failed to create caregiver service.',
  CAREGIVER_SERVICE_UPDATE_FAILED = 'Failed to update caregiver service.',
  CAREGIVER_SERVICE_DELETION_FAILED = 'Failed to delete caregiver service.',
}
export enum AddressErrorMessages {
  ADDRESS_NOT_FOUND = 'Address not found',
  ADDRESS_CREATION_FAILED = 'Failed to create address',
  ADDRESS_UPDATE_FAILED = 'Failed to update address',
  ADDRESS_DELETION_FAILED = 'Failed to delete address',
  ADDRESS_FETCH_FAILED = 'Failed to fetch address(es)',
  DEFAULT_ADDRESS_NOT_FOUND = 'Default address not found',
  INVALID_ADDRESS_DATA = 'Invalid address data provided',
  UNAUTHORIZED_ACCESS = 'You are not authorized to access this address',
}
export enum AddressLogMessages {
  ADDRESS_CREATION_STARTED = 'Creating new address',
  ADDRESS_CREATED_SUCCESS = 'Address created successfully',
  ADDRESS_CREATION_ERROR = 'Failed to create address',
  ADDRESS_FETCH_STARTED = 'Fetching address by ID',
  ADDRESS_FETCH_SUCCESS = 'Address fetched successfully',
  ADDRESS_FETCH_ALL_STARTED = 'Fetching all addresses for user',
  ADDRESS_FETCH_ALL_SUCCESS = 'Addresses fetched successfully',
  ADDRESS_FETCH_ERROR = 'Failed to fetch address(es)',

  DEFAULT_ADDRESS_FETCH_STARTED = 'Fetching default address',
  DEFAULT_ADDRESS_FETCH_SUCCESS = 'Default address fetched successfully',
  DEFAULT_ADDRESS_NOT_FOUND_WARNING = 'Default address not found',
  SET_DEFAULT_ADDRESS_STARTED = 'Setting default address',
  SET_DEFAULT_ADDRESS_SUCCESS = 'Default address set successfully',
  SET_DEFAULT_ADDRESS_ERROR = 'Failed to set default address',
  ADDRESS_UPDATE_STARTED = 'Updating address',
  ADDRESS_UPDATE_SUCCESS = 'Address updated successfully',
  ADDRESS_UPDATE_ERROR = 'Failed to update address',
  ADDRESS_DELETION_STARTED = 'Deleting address',
  ADDRESS_DELETION_SUCCESS = 'Address deleted successfully',
  ADDRESS_DELETION_ERROR = 'Failed to delete address',
  ADDRESS_NOT_FOUND_WARNING = 'Address not found',
}
export const enum AvailabilitySlotErrorMessages {
  AVAILABILITY_SLOT_NOT_FOUND = 'AVAILABILITY_SLOT_NOT_FOUND',
  INVALID_START_END_TIME = 'INVALID_START_END_TIME',
  START_TIME_BEFORE_END_TIME = 'START_TIME_BEFORE_END_TIME',
  TIMES_WITHIN_BUSINESS_HOURS = 'TIMES_WITHIN_BUSINESS_HOURS',
  MINIMUM_DURATION_ONE_HOUR = 'MINIMUM_DURATION_ONE_HOUR',
  OVERLAPPING_SLOT = 'OVERLAPPING_SLOT',
  ARRAY_LENGTH_MISMATCH = 'ARRAY_LENGTH_MISMATCH',
  PAY_RATE_NEGATIVE = 'PAY_RATE_NEGATIVE',
  MIN_RATE_EXCEEDS_MAX_RATE = 'MIN_RATE_EXCEEDS_MAX_RATE',
  MAX_RATE_UNREASONABLE = 'MAX_RATE_UNREASONABLE',
  AVAILABILITY_SLOT_CREATION_FAILED = 'AVAILABILITY_SLOT_CREATION_FAILED',
  AVAILABILITY_SLOT_UPDATE_FAILED = 'AVAILABILITY_SLOT_UPDATE_FAILED',
  AVAILABILITY_SLOT_DELETION_FAILED = 'AVAILABILITY_SLOT_DELETION_FAILED',
  AVAILABILITY_SLOT_FETCH_FAILED = 'AVAILABILITY_SLOT_FETCH_FAILED',
  UPDATE_SINGLE_SLOT_ONLY = 'UPDATE_SINGLE_SLOT_ONLY',
  CAREGIVER_PROFILE_NOT_FOUND_CREATE_FIRST = 'CAREGIVER_PROFILE_NOT_FOUND_CREATE_FIRST',
  AVAILABLE_TIME_SLOTS_FETCH_FAILED = 'AVAILABLE_TIME_SLOTS_FETCH_FAILED',
  BOOKING_DATE_IN_PAST = 'BOOKING_DATE_IN_PAST',
  DURATION_EXCEEDS_MAXIMUM = 'DURATION_EXCEEDS_MAXIMUM',
}

export const enum AvailabilitySlotSuccessMessages {
  AVAILABILITY_SLOT_CREATED = 'AVAILABILITY_SLOT_CREATED',
  AVAILABILITY_SLOTS_CREATED = 'AVAILABILITY_SLOTS_CREATED',
  AVAILABILITY_SLOT_UPDATED = 'AVAILABILITY_SLOT_UPDATED',
  AVAILABILITY_SLOT_DELETED = 'AVAILABILITY_SLOT_DELETED',
  AVAILABILITY_SLOT_DEACTIVATED = 'AVAILABILITY_SLOT_DEACTIVATED',
  AVAILABILITY_SLOTS_RETRIEVED = 'AVAILABILITY_SLOTS_RETRIEVED',
  MY_AVAILABILITY_SLOTS_RETRIEVED = 'MY_AVAILABILITY_SLOTS_RETRIEVED',
  CAREGIVER_AVAILABILITY_SLOTS_RETRIEVED = 'CAREGIVER_AVAILABILITY_SLOTS_RETRIEVED',
  AVAILABLE_SLOTS_RETRIEVED = 'AVAILABLE_SLOTS_RETRIEVED',
  AVAILABLE_TIME_SLOTS_RETRIEVED = 'AVAILABLE_TIME_SLOTS_RETRIEVED',
  ALL_AVAILABILITY_SLOTS_DELETED = 'ALL_AVAILABILITY_SLOTS_DELETED',
}
export const enum BookingErrorMessages {
  BOOKING_NOT_FOUND = 'Booking not found.',
  INVALID_BOOKING_STATUS = 'Invalid booking status.',
  INVALID_START_TIME = 'Invalid start time for booking.',
  INVALID_DURATION = 'Invalid duration for booking.',
  INVALID_SERVICE_LOCATION = 'Invalid service location provided.',
  INSUFFICIENT_FUNDS = 'Insufficient funds for booking.',
  BOOKING_CREATION_FAILED = 'Failed to create booking.',
  BOOKING_UPDATE_FAILED = 'Failed to update booking.',
  BOOKING_CANCELLATION_FAILED = 'Failed to cancel booking.',
  CAREGIVER_NOT_AVAILABLE = 'Caregiver is not available at the requested time.',
  BOOKING_ALREADY_EXISTS = 'Booking already exists for this time and location',
  BOOKING_CANCELLATION_TIME_EXCEEDED = 'Booking cancellation time window has been exceeded.',
  BOOKING_DELETION_FAILED = 'Failed to delete booking.',
}
export const enum ServiceSessionErrorMessages {
  SERVICE_SESSION_NOT_FOUND = 'Service session not found.',
  SESSION_ALREADY_CLOCKED_IN = 'Session is already clocked in.',
  SESSION_NOT_CLOCKED_IN = 'Session must be clocked in before clocking out.',
  INVALID_CLOCK_TIME = 'Invalid clock in/out time.',
  SERVICE_SESSION_CREATION_FAILED = 'Failed to create service session.',
  SERVICE_SESSION_UPDATE_FAILED = 'Failed to update service session.',
}
export const enum ClockEventErrorMessages {
  CLOCK_EVENT_NOT_FOUND = 'Clock event not found.',
  INVALID_CLOCK_TYPE = 'Invalid clock event type.',
  INVALID_CLOCK_LOCATION = 'Invalid location for clock event.',
  CLOCK_EVENT_CREATION_FAILED = 'Failed to create clock event.',
}
export const enum LocationPingErrorMessages {
  LOCATION_PING_NOT_FOUND = 'Location ping not found.',
  INVALID_PING_LOCATION = 'Invalid location for ping.',
  LOCATION_PING_CREATION_FAILED = 'Failed to create location ping.',
}
export const enum PaymentErrorMessages {
  PAYMENT_NOT_FOUND = 'Payment not found.',
  INVALID_PAYMENT_METHOD = 'Invalid payment method.',
  INVALID_PAYMENT_STATUS = 'Invalid payment status.',
  PAYMENT_CREATION_FAILED = 'Failed to create payment.',
  PAYMENT_PROCESSING_FAILED = 'Failed to process payment.',
  INVALID_AMOUNT = 'Invalid payment amount.',
}
export const enum EscrowErrorMessages {
  ESCROW_NOT_FOUND = 'Escrow not found.',
  INVALID_ESCROW_STATUS = 'Invalid escrow status.',
  ESCROW_HOLD_FAILED = 'Failed to hold funds in escrow.',
  ESCROW_RELEASE_FAILED = 'Failed to release funds from escrow.',
}
export const enum PayoutErrorMessages {
  PAYOUT_NOT_FOUND = 'Payout not found.',
  INVALID_PAYOUT_STATUS = 'Invalid payout status.',
  PAYOUT_PROCESSING_FAILED = 'Failed to process payout.',
  INSUFFICIENT_BALANCE = 'Insufficient balance for payout.',
}
export const enum RefundErrorMessages {
  REFUND_NOT_FOUND = 'Refund not found.',
  INVALID_REFUND_REASON = 'Invalid refund reason.',
  REFUND_AMOUNT_EXCEEDS_PAYMENT = 'Refund amount exceeds original payment.',
  REFUND_PROCESSING_FAILED = 'Failed to process refund.',
}
export const enum RatingReviewErrorMessages {
  RATING_REVIEW_NOT_FOUND = 'Rating review not found.',
  INVALID_STARS = 'Invalid star rating (must be between 1 and 5).',
  RATING_REVIEW_CREATION_FAILED = 'Failed to create rating review.',
  RATING_REVIEW_UPDATE_FAILED = 'Failed to update rating review.',
  RATING_REVIEW_DELETION_FAILED = 'Failed to delete rating review.',
  REVIEW_ALREADY_SUBMITTED = 'Review already submitted for this booking.',
  BOOKING_NOT_FOUND = 'Booking not found.',
  BOOKING_NOT_ELIGIBLE_FOR_REVIEW = 'Review can only be submitted after the service is completed (clock out approved).',
  ONLY_BOOKING_CLIENT_CAN_REVIEW = 'Only the client who booked the service can submit a review.',
}
export const enum MessageThreadErrorMessages {
  MESSAGE_THREAD_NOT_FOUND = 'Message thread not found.',
  MESSAGE_THREAD_CREATION_FAILED = 'Failed to create message thread.',
  UNAUTHORIZED_ACCESS = 'You are not authorized to access this message thread.',
}
export const enum MessageErrorMessages {
  MESSAGE_NOT_FOUND = 'Message not found.',
  MESSAGE_CREATION_FAILED = 'Failed to send message.',
  INVALID_MESSAGE_BODY = 'Message body cannot be empty.',
}
export const enum NotificationErrorMessages {
  NOTIFICATION_NOT_FOUND = 'Notification not found.',
  INVALID_NOTIFICATION_TYPE = 'Invalid notification type.',
  NOTIFICATION_CREATION_FAILED = 'Failed to create notification.',
  NOTIFICATION_UPDATE_FAILED = 'Failed to update notification (e.g., mark as read).',
  NOTIFICATION_SEND_FAILED = 'Failed to send notification.',
  NOTIFICATION_FETCH_FAILED = 'Failed to fetch notifications.',
  DEVICE_REGISTRATION_FAILED = 'Failed to register device.',
  DEVICE_UNREGISTRATION_FAILED = 'Failed to unregister device.',
  DEVICE_NOT_FOUND = 'Device not found.',
  DEVICE_FETCH_FAILED = 'Failed to fetch devices.',
  TOPIC_SUBSCRIPTION_FAILED = 'Failed to subscribe to topic.',
  TOPIC_UNSUBSCRIPTION_FAILED = 'Failed to unsubscribe from topic.',
  FIREBASE_NOT_CONFIGURED = 'Firebase is not configured.',
}
export const enum AdminErrorMessages {
  ADMIN_NOT_FOUND = 'Admin not found.',
  INVALID_ADMIN_ROLE = 'Invalid admin role.',
  ADMIN_CREATION_FAILED = 'Failed to create admin.',
  ADMIN_UPDATE_FAILED = 'Failed to update admin.',
  ADMIN_DELETION_FAILED = 'Failed to delete admin.',
}
export const enum EmergencyEventErrorMessages {
  EMERGENCY_EVENT_NOT_FOUND = 'Emergency event not found.',
  EMERGENCY_EVENT_CREATION_FAILED = 'Failed to create emergency event.',
  INVALID_EMERGENCY_ACTION = 'Invalid action for emergency event.',
}
export enum TransactionStatusMessage {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const enum TimeDuration {
  IMMEDIATE = 0,
  WITHIN_1_HOUR = 60,
  WITHIN_2_HOURS = 120,
  WITHIN_24_HOURS = 1440,
  WITHIN_48_HOURS = 2880,
  NO_CANCELLATION = -1,
}

export const enum ChatErrorMessages {
  CONVERSATION_NOT_FOUND = 'Conversation not found.',
  CONVERSATION_CREATION_FAILED = 'Failed to create conversation.',
  MESSAGE_NOT_FOUND = 'Message not found.',
  MESSAGE_SEND_FAILED = 'Failed to send message.',
  UNAUTHORIZED_CONVERSATION_ACCESS = 'You are not authorized to access this conversation.',
  INVALID_MESSAGE_CONTENT = 'Message content cannot be empty.',
  CHAT_ONLY_FOR_ACTIVE_BOOKINGS = 'Chat is only available for confirmed or in-progress bookings.',
  TWILIO_SERVICE_ERROR = 'Twilio service error occurred.',
  TWILIO_TOKEN_GENERATION_FAILED = 'Failed to generate Twilio access token.',
  TWILIO_CONVERSATION_CREATION_FAILED = 'Failed to create Twilio conversation.',
  TWILIO_PARTICIPANT_ADD_FAILED = 'Failed to add participant to conversation.',
  INVALID_WEBHOOK_SIGNATURE = 'Invalid Twilio webhook signature.',
  WEBHOOK_PROCESSING_FAILED = 'Failed to process webhook event.',
}

export const enum ChatSuccessMessages {
  TWILIO_ACCESS_TOKEN_GENERATED = 'TWILIO_ACCESS_TOKEN_GENERATED',
  CONVERSATION_RETRIEVED = 'CONVERSATION_RETRIEVED',
  CONVERSATIONS_RETRIEVED = 'CONVERSATIONS_RETRIEVED',
  MESSAGES_RETRIEVED = 'MESSAGES_RETRIEVED',
  MESSAGES_MARKED_AS_SEEN = 'MESSAGES_MARKED_AS_SEEN',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  MESSAGES_FOUND = 'MESSAGES_FOUND',
}

export const enum ChatResponseMessages {
  MESSAGES_MARKED_AS_SEEN = 'Messages marked as seen successfully',
  MESSAGE_DELETED = 'Message deleted successfully',
}

export const enum WebhookSuccessMessages {
  MESSAGE_SAVED = 'MESSAGE_SAVED',
  EVENT_ACKNOWLEDGED = 'EVENT_ACKNOWLEDGED',
}

export const enum VoiceCallErrorMessages {
  VOICE_CALL_TOKEN_GENERATION_FAILED = 'Failed to generate voice call access token.',
  TWILIO_CREDENTIALS_NOT_CONFIGURED = 'Twilio credentials are not fully configured.',
  INVALID_IDENTITY = 'Invalid identity provided for voice call.',
  VOICE_CALL_INITIALIZATION_FAILED = 'Failed to initialize voice call.',
}

export const enum VoiceCallSuccessMessages {
  TOKEN_GENERATED = 'TOKEN_GENERATED',
}

export const enum AddressSuccessMessages {
  ADDRESS_CREATED = 'ADDRESS_CREATED',
  ADDRESSES_RETRIEVED = 'ADDRESSES_RETRIEVED',
  DEFAULT_ADDRESS_RETRIEVED = 'DEFAULT_ADDRESS_RETRIEVED',
  ADDRESS_RETRIEVED = 'ADDRESS_RETRIEVED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_SET_AS_DEFAULT = 'ADDRESS_SET_AS_DEFAULT',
  ADDRESS_DELETED = 'ADDRESS_DELETED',
}

export enum AddressOperationSummaries {
  CREATE_ADDRESS = 'Create a new address',
  GET_ALL_ADDRESSES = 'Get all addresses for the current user',
  GET_DEFAULT_ADDRESS = 'Get the default address for the current user',
  GET_ADDRESS_BY_ID = 'Get address by ID',
  UPDATE_ADDRESS = 'Update address',
  SET_DEFAULT_ADDRESS = 'Set address as default',
  DELETE_ADDRESS = 'Delete address',
}

export enum AuthOperationSummaries {
  LOGIN = 'User login',
  REGISTER = 'Register a new user',
  VERIFY_OTP = 'Verify phone OTP',
  REQUEST_OTP = 'Request verification OTP',
  RESEND_OTP = 'Resend verification OTP',
  FORGOT_PASSWORD = 'Request password reset OTP',
  VERIFY_RESET_OTP = 'Verify password reset OTP',
  RESET_PASSWORD = 'Reset password with OTP',
  REFRESH_TOKEN = 'Refresh access and refresh tokens',
  LOGOUT = 'Logout current session',
  LOGOUT_ALL = 'Logout from all devices',
  GET_PROFILE = 'Get current user profile',
  GET_SESSIONS = 'Get all active sessions for current user',
}

export enum AvailabilitySlotOperationSummaries {
  CREATE = 'Create availability slots',
  GET_ALL = 'Get all availability slots',
  GET_MY_SLOTS = 'Get current user availability slots',
  GET_BY_CAREGIVER = 'Get availability slots by caregiver ID',
  FIND_AVAILABLE = 'Find available slots for a caregiver',
  GET_AVAILABLE_TIMES = 'Get available time slots for booking',
  GET_BY_ID = 'Get availability slot by ID',
  UPDATE = 'Update availability slot',
  DEACTIVATE = 'Deactivate availability slot',
  DELETE = 'Delete availability slot',
  DELETE_ALL_BY_CAREGIVER = 'Delete all availability slots for a caregiver',
}

export enum BookingOperationSummaries {
  GET_USER_BOOKINGS = 'Get bookings for a specific user',
  CREATE = 'Create a new booking',
  CANCEL = 'Cancel a booking',
  GET_REBOOK_DETAILS = 'Get details for rebooking',
  GET_CAREGIVER_BOOKINGS = 'Get bookings for a specific caregiver',
  REBOOK = 'Create a booking from a previous one (Rebook)',
  DELETE = 'Delete a booking',
  GET_ALL_ADMIN = 'Get all bookings (Admin)',
  GET_CAREGIVER_BOOKINGS_PAGINATED = 'Get bookings for a caregiver with pagination',
  GET_USER_BOOKINGS_ADMIN = 'Get bookings for a user (Admin)',
  GET_BOOKING_BY_ID = 'Get a booking by ID',
}

export enum CaregiverProfileOperationSummaries {
  GET_ALL = 'Get all caregiver profiles',
  GET_BY_ID = 'Get a caregiver profile by ID',
  UPDATE_VERIFICATION = 'Update caregiver verification status',
  DELETE = 'Delete a caregiver profile',
  CREATE = 'Create a new caregiver profile',
  FIND_NEARBY = 'Find nearby caregivers',
  GET_BY_USER_ID = 'Get a caregiver profile by User ID',
  UPDATE = 'Update a caregiver profile',
}

export enum CertificateOperationSummaries {
  UPLOAD = 'Upload a certificate',
  GET_ALL = 'Get all certificates for a caregiver profile',
  GET_BY_ID = 'Get a certificate by ID',
  DELETE = 'Delete a certificate',
  UPDATE_STATUS = 'Update certificate verification status',
}

export enum ChatOperationSummaries {
  GET_TOKEN = 'Get Twilio access token',
  CREATE_OR_GET_CONVERSATION = 'Create or get conversation',
  GET_USER_CONVERSATIONS = 'Get user conversations',
  GET_MESSAGES = 'Get conversation messages',
  MARK_SEEN = 'Mark messages as seen',
  DELETE_MESSAGE = 'Delete a message',
  SEARCH_MESSAGES = 'Search messages',
}

export enum ClientProfileOperationSummaries {
  CREATE = 'Create a new client profile',
  GET_ALL = 'Get all client profiles',
  GET_BY_USER_ID = 'Get a client profile by User ID',
  GET_BY_ID = 'Get a client profile by ID',
  GET_AGE = 'Get client age',
  UPDATE = 'Update a client profile',
  DELETE = 'Delete a client profile',
}

export enum RoleOperationSummaries {
  CREATE = 'Create a new role',
  GET_ALL = 'Get all roles',
  GET_BY_ID = 'Get a single role by ID',
  GET_DETAILS = 'Get role details with user count',
  UPDATE = 'Update a role',
  DELETE = 'Delete a role',
}

export enum UserOperationSummaries {
  GET_ALL = 'Get all users with filtering and pagination',
  GET_BY_ID = 'Get a single user by ID',
  UPDATE = 'Update user information',
  UPDATE_PROFILE = 'Update user profile with optional avatar',
  UPDATE_PASSWORD = 'Update user password',
  UPDATE_STATUS = 'Update user status',
  DELETE = 'Delete a user',
  GET_TOTAL_PAYMENT_AMOUNT = 'Get user total payment amount',
}

export enum UserRoleOperationSummaries {
  GET_USER_ROLES = 'Get all roles assigned to a user',
  ASSIGN_ROLES = 'Assign roles to a user',
  REMOVE_ROLES = 'Remove all roles from a user',
}

export const enum BookingSuccessMessages {
  USER_BOOKINGS_RETRIEVED = 'USER_BOOKINGS_RETRIEVED',
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  REBOOKING_DETAILS_RETRIEVED = 'REBOOKING_DETAILS_RETRIEVED',
  CAREGIVER_BOOKINGS_RETRIEVED = 'CAREGIVER_BOOKINGS_RETRIEVED',
  REBOOKING_SUCCESSFUL = 'REBOOKING_SUCCESSFUL',
  BOOKING_DELETED = 'BOOKING_DELETED',
  ALL_BOOKINGS_RETRIEVED = 'ALL_BOOKINGS_RETRIEVED',
}

export const enum BookingResponseMessages {
  PREVIOUS_BOOKING_DETAILS_RETRIEVED = 'Previous booking details retrieved',
}

export const enum ClientProfileSuccessMessages {
  CLIENT_PROFILE_CREATED = 'CLIENT_PROFILE_CREATED',
  CLIENT_PROFILES_RETRIEVED = 'CLIENT_PROFILES_RETRIEVED',
  CLIENT_PROFILE_RETRIEVED = 'CLIENT_PROFILE_RETRIEVED',
  CLIENT_AGE_RETRIEVED = 'CLIENT_AGE_RETRIEVED',
  CLIENT_PROFILE_UPDATED = 'CLIENT_PROFILE_UPDATED',
  CLIENT_PROFILE_DELETED = 'CLIENT_PROFILE_DELETED',
}

export const enum RoleSuccessMessages {
  ROLE_CREATED = 'ROLE_CREATED',
  ROLES_RETRIEVED = 'ROLES_RETRIEVED',
  ROLE_RETRIEVED = 'ROLE_RETRIEVED',
  ROLE_DETAILS_RETRIEVED = 'ROLE_DETAILS_RETRIEVED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
}

export const enum UserSuccessMessages {
  USERS_RETRIEVED = 'USERS_RETRIEVED',
  USER_RETRIEVED = 'USER_RETRIEVED',
  USER_UPDATED = 'USER_UPDATED',
  PASSWORD_UPDATED = 'PASSWORD_UPDATED',
  USER_STATUS_UPDATED = 'USER_STATUS_UPDATED',
  USER_DELETED = 'USER_DELETED',
  TOTAL_PAYMENT_AMOUNT_RETRIEVED = 'TOTAL_PAYMENT_AMOUNT_RETRIEVED',
}

export const enum UserRoleSuccessMessages {
  USER_ROLES_RETRIEVED = 'USER_ROLES_RETRIEVED',
  ROLES_ASSIGNED = 'ROLES_ASSIGNED',
  ROLES_REMOVED = 'ROLES_REMOVED',
}

export const enum UserRoleResponseMessages {
  ROLES_ASSIGNED = 'Roles assigned successfully.',
  ROLES_REMOVED = 'Roles removed successfully.',
}

export const enum CaregiverProfileSuccessMessages {
  CAREGIVER_PROFILE_CREATED = 'CAREGIVER_PROFILE_CREATED',
  CAREGIVER_PROFILES_RETRIEVED = 'CAREGIVER_PROFILES_RETRIEVED',
  NEARBY_CAREGIVERS_RETRIEVED = 'NEARBY_CAREGIVERS_RETRIEVED',
  CAREGIVER_PROFILE_RETRIEVED = 'CAREGIVER_PROFILE_RETRIEVED',
  CAREGIVER_PROFILE_UPDATED = 'CAREGIVER_PROFILE_UPDATED',
  VERIFICATION_STATUS_UPDATED = 'VERIFICATION_STATUS_UPDATED',
  CAREGIVER_PROFILE_DELETED = 'CAREGIVER_PROFILE_DELETED',
}

export const enum CertificateSuccessMessages {
  CERTIFICATE_UPLOADED = 'Certificate uploaded successfully',
  CERTIFICATES_RETRIEVED = 'Certificates retrieved successfully',
  CERTIFICATE_RETRIEVED = 'Certificate retrieved successfully',
  CERTIFICATE_DELETED = 'Certificate deleted successfully',
  CERTIFICATE_STATUS_UPDATED = 'Certificate status updated successfully',
}

export const enum PaymentSummaryFieldDescriptions {
  TOTAL_EARNED = 'Total earned (completed + pending)',
  TOTAL_AVAILABLE_FOR_WITHDRAW = 'Available amount for withdrawal',
  TOTAL_COMPLETED = 'Total completed payments',
  TOTAL_PENDING = 'Total pending payments',
  BOOKING_COUNT = 'Number of bookings',
  TOTAL_HOURS = 'Total hours worked',
  AVERAGE_HOURLY_RATE = 'Average hourly rate',
  MONTHLY_BREAKDOWN = 'Monthly breakdown (sorted by date DESC)',
  MONTH = 'Month in YYYY-MM format',
  TOTAL_AMOUNT = 'Total amount for the month',
  COMPLETED_AMOUNT = 'Completed payment amount',
  PENDING_AMOUNT = 'Pending payment amount',
  DETAILED_PAYMENT_DATA = 'Detailed payment data',
  PAYMENT_DATE = 'Payment date',
  SERVICE_TYPE = 'Service type',
  DURATION = 'Duration in hours',
}

export const enum MapsErrorMessages {
  CAREGIVER_PROFILE_NOT_FOUND = 'Caregiver profile not found.',
  UNAUTHORIZED_BOOKING_ACCESS = 'You do not have access to this booking.',
  ONLY_ASSIGNED_CAREGIVER_CAN_UPDATE = 'Only the assigned caregiver can update location.',
  LOCATION_UPDATE_ONLY_IN_PROGRESS = 'Location can only be updated when booking is in progress.',
  CAREGIVER_MUST_CLOCK_IN = 'Caregiver must clock in before updating location.',
  LOCATION_UPDATE_FAILED = 'Failed to update location.',
  LOCATION_FETCH_FAILED = 'Failed to fetch location.',
  LOCATION_CACHE_DELETE_FAILED = 'Failed to delete location cache.',
  INVALID_LOCATION_DATA = 'Invalid location data provided.',
  BOOKING_NOT_IN_PROGRESS = 'Booking is not in progress.',
  ONLY_CAREGIVERS_CAN_UPDATE = 'Only caregivers can update location.',
  JOIN_BOOKING_ROOM_FAILED = 'Failed to join booking room.',
  GET_LAST_LOCATION_FAILED = 'Failed to get last location.',
  WEBSOCKET_CONNECTION_REJECTED = 'WebSocket connection rejected: No user data.',
}

export enum MapsLogMessages {
  LOCATION_UPDATE_STARTED = 'Updating caregiver location',
  LOCATION_UPDATED_SUCCESSFULLY = 'Location updated successfully',
  LOCATION_FETCH_STARTED = 'Fetching last known location',
  LOCATION_FETCHED_SUCCESSFULLY = 'Location fetched successfully',
  LOCATION_CACHE_DELETED = 'Location cache deleted successfully',
  BOOKING_ACCESS_VALIDATED = 'Booking access validated',
  LOCATION_UPDATE_VALIDATED = 'Location update validated',
  CLIENT_CONNECTED = 'Client connected',
  CLIENT_DISCONNECTED = 'Client disconnected',
  CONNECTION_REJECTED = 'Connection rejected: No user data',
  USER_JOINED_BOOKING_ROOM = 'User joined booking room',
  LOCATION_UPDATED_FOR_BOOKING = 'Location updated for booking',
  ERROR_JOINING_BOOKING_ROOM = 'Error joining booking room',
  ERROR_UPDATING_LOCATION = 'Error updating location',
  ERROR_GETTING_LAST_LOCATION = 'Error getting last location',
}

export const enum MapsApiResponseDescriptions {
  LOCATION_UPDATE_SUCCESS = 'Location updated successfully',
  LOCATION_RETRIEVED = 'Location retrieved successfully',
  NO_LOCATION_AVAILABLE = 'No location data available',
  INVALID_BOOKING_ID = 'Invalid booking ID',
  UNAUTHORIZED_ACCESS = 'Unauthorized access to booking location',
  CAREGIVER_PROFILE_NOT_FOUND = 'Caregiver profile not found',
  BOOKING_NOT_IN_PROGRESS = 'Booking is not in progress',
  CAREGIVER_NOT_CLOCKED_IN = 'Caregiver must clock in before updating location',
  BOOKING_ROOM_JOINED = 'Successfully joined booking room',
}

export const enum MapsResponseMessages {
  BOOKING_ROOM_JOINED = 'Successfully joined booking room',
  LOCATION_UPDATED = 'Location updated successfully',
  NO_LOCATION_DATA = 'No location data available',
}