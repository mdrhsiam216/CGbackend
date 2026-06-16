import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  ClientProfileSuccessMessages,
  ClientProfileOperationSummaries,
  ClientProfileApiResponseDescriptions,
  ApiResponseDescriptions,
} from '../../shared/enums';
import { ClientProfileService } from './client-profile.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { QueryClientProfileDto } from './dto/query-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ResponseClientProfileDto } from './dto/response-client-profile.dto';

@ApiTags('Client Profiles')
@Controller('client-profiles')
export class ClientProfileController {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILE_CREATED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.CREATE })
  @ApiResponse({
    status: 201,
    description: ClientProfileSuccessMessages.CLIENT_PROFILE_CREATED,
    type: ResponseClientProfileDto,
  })
  @ApiBadRequestResponse({
    description: ClientProfileApiResponseDescriptions.INVALID_PROFILE_DATA,
  })
  create(@Body() createClientProfileDto: CreateClientProfileDto) {
    return this.clientProfileService.create(createClientProfileDto);
  }

  @Get()
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILES_RETRIEVED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.GET_ALL })
  @ApiResponse({
    status: 200,
    description: ClientProfileSuccessMessages.CLIENT_PROFILES_RETRIEVED,
    type: [ResponseClientProfileDto],
  })
  findAll(@Query() queryDto: QueryClientProfileDto) {
    return this.clientProfileService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILE_RETRIEVED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.GET_BY_USER_ID })
  @ApiResponse({
    status: 200,
    description: ClientProfileSuccessMessages.CLIENT_PROFILE_RETRIEVED,
    type: ResponseClientProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: ClientProfileApiResponseDescriptions.CLIENT_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.clientProfileService.findOne(userId);
  }

  @Get(':id')
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILE_RETRIEVED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.GET_BY_ID })
  @ApiResponse({
    status: 200,
    description: ClientProfileSuccessMessages.CLIENT_PROFILE_RETRIEVED,
    type: ResponseClientProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: ClientProfileApiResponseDescriptions.CLIENT_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientProfileService.findOne(id);
  }

  @Get(':id/age')
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_AGE_RETRIEVED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.GET_AGE })
  @ApiResponse({
    status: 200,
    description: ClientProfileSuccessMessages.CLIENT_AGE_RETRIEVED,
    type: Number,
  })
  @ApiResponse({
    status: 404,
    description: ClientProfileApiResponseDescriptions.CLIENT_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  getAge(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientProfileService.getAge(id);
  }

  @Patch(':id')
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILE_UPDATED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.UPDATE })
  @ApiResponse({
    status: 200,
    description: ClientProfileSuccessMessages.CLIENT_PROFILE_UPDATED,
    type: ResponseClientProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: ClientProfileApiResponseDescriptions.CLIENT_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: ClientProfileApiResponseDescriptions.INVALID_PROFILE_DATA,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientProfileDto: UpdateClientProfileDto,
  ) {
    return this.clientProfileService.update(id, updateClientProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(ClientProfileSuccessMessages.CLIENT_PROFILE_DELETED)
  @ApiOperation({ summary: ClientProfileOperationSummaries.DELETE })
  @ApiResponse({
    status: 204,
    description: ClientProfileSuccessMessages.CLIENT_PROFILE_DELETED,
  })
  @ApiResponse({
    status: 404,
    description: ClientProfileApiResponseDescriptions.CLIENT_PROFILE_NOT_FOUND,
  })
  @ApiBadRequestResponse({ description: ApiResponseDescriptions.BAD_REQUEST })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientProfileService.remove(id);
  }
}
