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
import { TopCaregiversQueryDto } from './dtos/top-caregivers-query.dto';
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
  // Query parameters validated by DTO
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
    @Query() query: TopCaregiversQueryDto,
  ): Promise<TopCaregiversResponseDto> {
    const {
      page = 1,
      limit = 10,
      minRating = 4.0,
      minReviews = 1,
      sortBy = 'rating',
      order = 'DESC',
    } = query;

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