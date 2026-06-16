import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  SuccessResponseDto,
  BookingListResponseDto,
} from '../dtos';
import {
  ApiResponseDescriptions,
  BookingApiResponseDescriptions,
  BookingSuccessMessages,
} from 'src/shared/enums';
import { BookingPaymentResponseDto } from '../dtos/booking-response.dto';


export const ApiBadRequestError = (description?: string) =>
  ApiBadRequestResponse({
    description: description || BookingApiResponseDescriptions.INVALID_BOOKING_ID_OR_USER_ID,
    type: ErrorResponseDto,
  });

export const ApiUnauthorizedError = () =>
  ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED_ACCESS,
    type: ErrorResponseDto,
  });

export const ApiNotFoundError = (description?: string) =>
  ApiNotFoundResponse({
    description: description || ApiResponseDescriptions.USER_NOT_FOUND,
    type: ErrorResponseDto,
  });


export const ApiBookingListResponse = () =>
  ApiOkResponse({
    description: BookingSuccessMessages.USER_BOOKINGS_RETRIEVED,
    type: BookingListResponseDto,
  });

export const ApiBookingCreatedResponse = () =>
  ApiCreatedResponse({
    description: BookingSuccessMessages.BOOKING_CREATED,
    type: BookingPaymentResponseDto,
  });

export const ApiBookingSuccessResponse = (description: string) =>
  ApiOkResponse({
    description,
    type: SuccessResponseDto,
  });

export const ApiBookingDeletedResponse = () =>
  ApiNoContentResponse({
    description: BookingSuccessMessages.BOOKING_DELETED,
  });


export const ApiCommonBookingErrors = () =>
  applyDecorators(
    ApiBadRequestError(),
    ApiUnauthorizedError(),
    ApiNotFoundError(),
  );

export const ApiUserBookingResponses = () =>
  applyDecorators(
    ApiBookingListResponse(),
    ApiBadRequestResponse({
      description: BookingApiResponseDescriptions.USER_ID_REQUIRED,
      type: ErrorResponseDto,
    }),
    ApiUnauthorizedError(),
    ApiNotFoundError(ApiResponseDescriptions.USER_NOT_FOUND),
  );

export const ApiCaregiverBookingResponses = () =>
  applyDecorators(
    ApiBookingListResponse(),
    ApiBadRequestResponse({
      description: BookingApiResponseDescriptions.CAREGIVER_ID_REQUIRED,
      type: ErrorResponseDto,
    }),
    ApiNotFoundError(BookingApiResponseDescriptions.CAREGIVER_NOT_FOUND),
  );
