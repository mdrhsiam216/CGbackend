import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import {
  CaregiverProfileSuccessMessages,
  CaregiverProfileOperationSummaries,
  CaregiverProfileApiResponseDescriptions,
} from '../../../shared/enums';
import { CaregiverProfileService } from '../caregiver-profile.service';
import { QueryCaregiverProfileDto } from '../dto/query-caregiver-profile.dto';
import { ResponseCaregiverProfileDto } from '../dto/response-caregiver-profile.dto';

@ApiTags('Admin Caregiver Profiles')
@Controller('admin/caregiver-profiles')
export class CaregiverProfileAdminController {
  constructor(
    private readonly caregiverProfileService: CaregiverProfileService,
  ) {}

  @Get()
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILES_RETRIEVED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.GET_ALL })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILES_RETRIEVED,
    type: [ResponseCaregiverProfileDto],
  })
  findAll(@Query() queryDto: QueryCaregiverProfileDto) {
    return this.caregiverProfileService.findAll(queryDto);
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverProfileService.findOne(id);
  }

  @Patch(':id/verification')
  @ResponseMessage(CaregiverProfileSuccessMessages.VERIFICATION_STATUS_UPDATED)
  @ApiOperation({
    summary: CaregiverProfileOperationSummaries.UPDATE_VERIFICATION,
  })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.VERIFICATION_STATUS_UPDATED,
    type: ResponseCaregiverProfileDto,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  updateVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('verified', ParseBoolPipe) verified: boolean,
  ) {
    return this.caregiverProfileService.updateVerificationStatus(id, verified);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_DELETED)
  @ApiOperation({ summary: CaregiverProfileOperationSummaries.DELETE })
  @ApiResponse({
    status: 200,
    description: CaregiverProfileSuccessMessages.CAREGIVER_PROFILE_DELETED,
  })
  @ApiResponse({
    status: 404,
    description:
      CaregiverProfileApiResponseDescriptions.CAREGIVER_PROFILE_NOT_FOUND,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverProfileService.remove(id);
  }
}
