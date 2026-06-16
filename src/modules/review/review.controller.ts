import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ResponseReviewDto } from './dto/response-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/auth.interface';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ApiResponseDescriptions } from '../../shared/enums';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Review created successfully')
  @ApiOperation({
    summary: 'Create a review for a completed service (booking)',
    description:
      'Submit a review after the service is completed (clock out approved). Only the client who booked the service can review. One review per booking.',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: ResponseReviewDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request (e.g. booking not completed, or only client can review)',
  })
  @ApiResponse({
    status: 401,
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Review already submitted for this booking',
  })
  async create(
    @CurrentUser() user: JwtUser,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ResponseReviewDto> {
    return this.reviewService.create(user.userId, createReviewDto);
  }

  @Get('caregiver/:caregiverProfileId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Reviews retrieved successfully')
  @ApiOperation({
    summary: 'Get all reviews for a specific caregiver profile',
    description:
      'Returns all service-based reviews for the caregiver. Average rating on profile is derived from these reviews.',
  })
  @ApiParam({
    name: 'caregiverProfileId',
    type: 'string',
    description: 'Caregiver profile ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [ResponseReviewDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Reviews not found',
  })
  async getReviewsByCaregiver(
    @Param('caregiverProfileId', ParseUUIDPipe) caregiverProfileId: string,
  ): Promise<ResponseReviewDto[]> {
    return this.reviewService.findByCaregiverProfileId(caregiverProfileId);
  }

  @Get('caregiver/:caregiverProfileId/stats')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Review statistics retrieved successfully')
  @ApiOperation({
    summary: 'Get review statistics for a specific caregiver profile',
    description:
      'Average rating and total review count based on completed services.',
  })
  @ApiParam({
    name: 'caregiverProfileId',
    type: 'string',
    description: 'Caregiver profile ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Review statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        averageRating: {
          type: 'number',
          example: 4.5,
          description: 'Average rating (0-5)',
        },
        totalReviews: {
          type: 'number',
          example: 23,
          description: 'Total number of reviews',
        },
      },
    },
  })
  async getReviewStats(
    @Param('caregiverProfileId', ParseUUIDPipe) caregiverProfileId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    return this.reviewService.getReviewStats(caregiverProfileId);
  }
}
