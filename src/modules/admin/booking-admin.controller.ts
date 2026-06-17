import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingAdminService } from './booking-admin.service';
import { TopCaregiversResponseDto } from './dtos/top-caregivers-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('admin/bookings')
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class BookingAdminController {
  constructor(private readonly bookingAdminService: BookingAdminService) {}

  @Get('top-caregivers')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Top performing caregivers retrieved successfully')
  @ApiOperation({
    summary: 'Get top performing caregivers based on ratings and reviews',
    description: `
      Retrieves a list of top-performing caregivers sorted by their average rating.
      Only includes caregivers with at least the minimum rating and minimum number of reviews.
      Requires ADMIN role.
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum average rating to include (default: 4.0)',
    example: 4.0,
  })
  @ApiQuery({
    name: 'minReviews',
    required: false,
    type: Number,
    description: 'Minimum number of reviews required (default: 1)',
    example: 5,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['rating', 'reviews', 'bookings'],
    description: 'Field to sort by (default: rating)',
    example: 'rating',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Top performing caregivers retrieved successfully',
    type: TopCaregiversResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Admin role required)',
  })
  async getTopPerformingCaregivers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('minRating') minRating: number = 3.0,
    @Query('minReviews') minReviews: number = 1,
    @Query('sortBy') sortBy: 'rating' | 'reviews' | 'bookings' = 'rating',
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<TopCaregiversResponseDto> {
    return this.bookingAdminService.getTopPerformingCaregivers(
      page,
      limit,
      minRating,
      minReviews,
      sortBy,
      order,
    );
  }
}