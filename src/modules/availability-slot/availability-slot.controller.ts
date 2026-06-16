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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AvailabilitySlotSuccessMessages,
  AvailabilitySlotOperationSummaries,
} from 'src/shared/enums';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/auth.interface';
import { AvailabilitySlotService } from './availability-slot.service';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { GetAvailableTimeSlotsDto } from './dto/get-available-time-slots.dto';
import { QueryAvailabilitySlotDto } from './dto/query-availability-slot-dto';
import { ResponseAvailabilitySlotDto } from './dto/response-availability-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-availability-slot.dto';

@ApiTags('Availability Slots')
@ApiBearerAuth()
@Controller('availability-slots')
@UseGuards(JwtAuthGuard)
export class AvailabilitySlotController {
  constructor(
    private readonly availabilitySlotService: AvailabilitySlotService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_CREATED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.CREATE })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_CREATED,
    type: [ResponseAvailabilitySlotDto],
  })
  create(
    @CurrentUser() user: JwtUser,
    @Body() createAvailabilitySlotDto: CreateAvailabilitySlotDto,
  ) {
    return this.availabilitySlotService.create(
      user.userId,
      createAvailabilitySlotDto,
    );
  }

  @Get()
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_RETRIEVED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.GET_ALL })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_RETRIEVED,
    type: [ResponseAvailabilitySlotDto],
  })
  findAll(@Query() queryDto: QueryAvailabilitySlotDto) {
    return this.availabilitySlotService.findAll(queryDto);
  }

  @Get('my-slots')
  @ResponseMessage(
    AvailabilitySlotSuccessMessages.MY_AVAILABILITY_SLOTS_RETRIEVED,
  )
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.GET_MY_SLOTS })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      AvailabilitySlotSuccessMessages.MY_AVAILABILITY_SLOTS_RETRIEVED,
    type: [ResponseAvailabilitySlotDto],
  })
  findMySlots(@CurrentUser() user: JwtUser) {
    return this.availabilitySlotService.findByUserId(user.userId);
  }

  @Get('caregiver/:caregiverId')
  @ResponseMessage(
    AvailabilitySlotSuccessMessages.CAREGIVER_AVAILABILITY_SLOTS_RETRIEVED,
  )
  @ApiOperation({
    summary: AvailabilitySlotOperationSummaries.GET_BY_CAREGIVER,
  })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      AvailabilitySlotSuccessMessages.CAREGIVER_AVAILABILITY_SLOTS_RETRIEVED,
    type: [ResponseAvailabilitySlotDto],
  })
  findByCaregiverId(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.availabilitySlotService.findByCaregiverId(caregiverId);
  }

  @Get('caregiver/:caregiverId/available')
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABLE_SLOTS_RETRIEVED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.FIND_AVAILABLE })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiQuery({
    name: 'daysOfWeek',
    required: false,
    description: 'Comma-separated days of week (0-6)',
  })
  @ApiQuery({
    name: 'timeSlots',
    required: false,
    description: 'Comma-separated time slots',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABLE_SLOTS_RETRIEVED,
    type: [ResponseAvailabilitySlotDto],
  })
  findAvailableSlots(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('daysOfWeek') daysOfWeek?: string,
    @Query('timeSlots') timeSlots?: string,
  ) {
    const days = daysOfWeek ? daysOfWeek.split(',').map(Number) : undefined;
    const slots = timeSlots ? timeSlots.split(',') : undefined;

    return this.availabilitySlotService.findAvailableSlots(
      caregiverId,
      days,
      slots,
    );
  }

  @Get('caregiver/:caregiverId/available-times')
  @ResponseMessage(
    AvailabilitySlotSuccessMessages.AVAILABLE_TIME_SLOTS_RETRIEVED,
  )
  @ApiOperation({
    summary: AvailabilitySlotOperationSummaries.GET_AVAILABLE_TIMES,
  })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABLE_TIME_SLOTS_RETRIEVED,
    schema: {
      type: 'array',
      items: {
        type: 'string',
        example: '09:00',
      },
    },
  })
  getAvailableTimeSlots(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query() dto: GetAvailableTimeSlotsDto,
  ) {
    return this.availabilitySlotService.getAvailableTimeSlots(caregiverId, dto);
  }

  @Get(':id')
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_RETRIEVED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.GET_BY_ID })
  @ApiParam({ name: 'id', description: 'Availability Slot ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOTS_RETRIEVED,
    type: ResponseAvailabilitySlotDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitySlotService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_UPDATED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.UPDATE })
  @ApiParam({ name: 'id', description: 'Availability Slot ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_UPDATED,
    type: ResponseAvailabilitySlotDto,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAvailabilitySlotDto: UpdateAvailabilitySlotDto,
  ) {
    return this.availabilitySlotService.update(id, updateAvailabilitySlotDto);
  }

  @Patch(':id/deactivate')
  @ResponseMessage(
    AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_DEACTIVATED,
  )
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.DEACTIVATE })
  @ApiParam({ name: 'id', description: 'Availability Slot ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_DEACTIVATED,
    type: ResponseAvailabilitySlotDto,
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitySlotService.deactivateSlot(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_DELETED)
  @ApiOperation({ summary: AvailabilitySlotOperationSummaries.DELETE })
  @ApiParam({ name: 'id', description: 'Availability Slot ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: AvailabilitySlotSuccessMessages.AVAILABILITY_SLOT_DELETED,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitySlotService.remove(id);
  }

  @Delete('caregiver/:caregiverId/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(
    AvailabilitySlotSuccessMessages.ALL_AVAILABILITY_SLOTS_DELETED,
  )
  @ApiOperation({
    summary: AvailabilitySlotOperationSummaries.DELETE_ALL_BY_CAREGIVER,
  })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: AvailabilitySlotSuccessMessages.ALL_AVAILABILITY_SLOTS_DELETED,
  })
  removeAllByCaregiverId(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
  ) {
    return this.availabilitySlotService.removeAllByCaregiverId(caregiverId);
  }
}
