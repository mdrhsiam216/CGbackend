import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBadRequestResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import {
  CaregiverProfileSuccessMessages,
  CaregiverProfileOperationSummaries,
  CaregiverProfileApiResponseDescriptions,
  ApiResponseDescriptions,
} from '../../../shared/enums';
import { CaregiverProfileService } from '../caregiver-profile.service';
import { CreateCaregiverProfileDto } from '../dto/create-caregiver-profile.dto';
import { QueryCaregiverProfileDto } from '../dto/query-caregiver-profile.dto';
import { QueryNearbyCaregiverProfileDto } from '../dto/query-nearby-caregiver-profile.dto';
import { UpdateCaregiverProfileDto } from '../dto/update-caregiver-profile.dto';
import { ResponseCaregiverProfileDto } from '../dto/response-caregiver-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QueryCaregiverTransformPipe } from '../dto/query-caregiver-transform.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/interfaces/auth.interface';
import { CaregiverMonthlyPerformanceDto } from '../dto/caregiver-performance.dto';

@ApiTags('Caregiver Profiles')
@ApiExtraModels(QueryCaregiverProfileDto, QueryNearbyCaregiverProfileDto)
@Controller('caregiver-profiles')
export class CaregiverProfileUserController {
  constructor(
    private readonly caregiverProfileService: CaregiverProfileService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_CREATED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.CREATE })
  @ApiResponse({
    status: 201,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_CREATED,
    type: ResponseCaregiverProfileDto,
  })
  @ApiBadRequestResponse({
    description: CaregiverProfileApiResponseDescriptions.INVALID_PROFILE_DATA,
  })
  create(@Body() createCaregiverProfileDto: CreateCaregiverProfileDto) {
    return this.caregiverProfileService.create(createCaregiverProfileDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILES_RETRIEVED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.GET_ALL })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILES_RETRIEVED,
    type: [ResponseCaregiverProfileDto],
  })
  findAll(
    @Query(QueryCaregiverTransformPipe) queryDto: QueryCaregiverProfileDto,
  ) {
    return this.caregiverProfileService.findAll(queryDto);
  }

  @Get('nearby')
  @ResponseMessage(CaregiverProfileSuccessMessages.NEARBY_CAREGIVERS_RETRIEVED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.FIND_NEARBY })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.NEARBY_CAREGIVERS_RETRIEVED,
    type: [ResponseCaregiverProfileDto],
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.INVALID_DATA })
  findNearby(
    @Query(QueryCaregiverTransformPipe)
    queryDto: QueryNearbyCaregiverProfileDto,
  ) {
    return this.caregiverProfileService.findNearby(queryDto);
  }

  @Get('user/:userId')
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_RETRIEVED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.GET_BY_USER_ID })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_RETRIEVED,
    type: ResponseCaregiverProfileDto,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.caregiverProfileService.findByUserId(userId);
  }

  @Get('me/performance/monthly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_RETRIEVED)
  @ApiOperation({
    summary: 'Get current caregiver monthly performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly performance metrics for the current caregiver',
    type: CaregiverMonthlyPerformanceDto,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  getMyMonthlyPerformance(
    @CurrentUser() user: JwtUser,
  ): Promise<CaregiverMonthlyPerformanceDto> {
    return this.caregiverProfileService.getMonthlyPerformanceForUser(
      user.userId,
    );
  }

  @Get(':id')
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_RETRIEVED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.GET_BY_ID })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_RETRIEVED,
    type: ResponseCaregiverProfileDto,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverProfileService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_UPDATED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.UPDATE })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_UPDATED,
    type: ResponseCaregiverProfileDto,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: CaregiverProfileApiResponseDescriptions.INVALID_PROFILE_DATA,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaregiverProfileDto: UpdateCaregiverProfileDto,
  ) {
    return this.caregiverProfileService.update(id, updateCaregiverProfileDto);
  }
}
