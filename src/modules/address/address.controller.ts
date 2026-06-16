import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  AddressSuccessMessages,
  AddressOperationSummaries,
} from '../../shared/enums';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressResponseDto } from './dto/response-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  private getUserId(user: any): string {
    if (!user || !user.userId) {
      throw new BadRequestException('User authentication required');
    }
    return user.userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(AddressSuccessMessages.ADDRESS_CREATED)
  @ApiOperation({ summary: AddressOperationSummaries.CREATE_ADDRESS })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: AddressSuccessMessages.ADDRESS_CREATED,
    type: AddressResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    const userId = this.getUserId(user);
    return await this.addressService.create(userId, createAddressDto);
  }

  @Get()
  @ResponseMessage(AddressSuccessMessages.ADDRESSES_RETRIEVED)
  @ApiOperation({ summary: AddressOperationSummaries.GET_ALL_ADDRESSES })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AddressSuccessMessages.ADDRESSES_RETRIEVED,
    type: [AddressResponseDto],
  })
  async findAll(@CurrentUser() user: any) {
    const userId = this.getUserId(user);
    return await this.addressService.findAll(userId);
  }

  @Get('default')
  @ResponseMessage(AddressSuccessMessages.DEFAULT_ADDRESS_RETRIEVED)
  @ApiOperation({ summary: AddressOperationSummaries.GET_DEFAULT_ADDRESS })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AddressSuccessMessages.DEFAULT_ADDRESS_RETRIEVED,
    type: AddressResponseDto,
  })
  async findDefault(@CurrentUser() user: any) {
    const userId = this.getUserId(user);
    return await this.addressService.findDefault(userId);
  }

  @Get(':id')
  @ResponseMessage(AddressSuccessMessages.ADDRESS_RETRIEVED)
  @ApiOperation({ summary: AddressOperationSummaries.GET_ADDRESS_BY_ID })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AddressSuccessMessages.ADDRESS_RETRIEVED,
    type: AddressResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const userId = this.getUserId(user);
    return await this.addressService.findOne(id, userId);
  }

  @Patch(':id')
  @ResponseMessage(AddressSuccessMessages.ADDRESS_UPDATED)
  @ApiOperation({ summary: AddressOperationSummaries.UPDATE_ADDRESS })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AddressSuccessMessages.ADDRESS_UPDATED,
    type: AddressResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const userId = this.getUserId(user);
    return await this.addressService.update(id, userId, updateAddressDto);
  }

  @Patch(':id/set-default')
  @ResponseMessage(AddressSuccessMessages.ADDRESS_SET_AS_DEFAULT)
  @ApiOperation({ summary: AddressOperationSummaries.SET_DEFAULT_ADDRESS })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AddressSuccessMessages.ADDRESS_SET_AS_DEFAULT,
    type: AddressResponseDto,
  })
  async setDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const userId = this.getUserId(user);
    return await this.addressService.setDefault(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(AddressSuccessMessages.ADDRESS_DELETED)
  @ApiOperation({ summary: AddressOperationSummaries.DELETE_ADDRESS })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: AddressSuccessMessages.ADDRESS_DELETED,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const userId = this.getUserId(user);
    return await this.addressService.remove(id, userId);
  }
}
