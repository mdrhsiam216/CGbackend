import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  RoleSuccessMessages,
  RoleOperationSummaries,
  ApiResponseDescriptions,
  RoleApiResponseDescriptions,
} from '../../shared/enums';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  // @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(RoleSuccessMessages.ROLE_CREATED)
  @ApiOperation({ summary: RoleOperationSummaries.CREATE })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: RoleSuccessMessages.ROLE_CREATED,
    type: Role,
  })
  @ApiResponse({
    status: 400,
    description: ApiResponseDescriptions.INVALID_DATA,
  })
  @ApiResponse({
    status: 409,
    description: ApiResponseDescriptions.ALREADY_EXISTS,
  })
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.createRole(createRoleDto);
  }

  @Get()
  @ResponseMessage(RoleSuccessMessages.ROLES_RETRIEVED)
  @ApiOperation({ summary: RoleOperationSummaries.GET_ALL })
  @ApiResponse({
    status: 200,
    description: RoleSuccessMessages.ROLES_RETRIEVED,
    type: [Role],
  })
  async findAllRoles(): Promise<Role[]> {
    return this.roleService.findAllRoles();
  }

  @Get(':id')
  @ResponseMessage(RoleSuccessMessages.ROLE_RETRIEVED)
  @ApiOperation({ summary: RoleOperationSummaries.GET_BY_ID })
  @ApiParam({ name: 'id', description: 'Role UUID', type: String })
  @ApiResponse({
    status: 200,
    description: RoleSuccessMessages.ROLE_RETRIEVED,
    type: Role,
  })
  @ApiResponse({
    status: 404,
    description: RoleApiResponseDescriptions.ROLE_NOT_FOUND,
  })
  async findOneRole(@Param('id') id: string): Promise<Role> {
    return this.roleService.findOneRole(id);
  }

  @Get(':id/details')
  @ResponseMessage(RoleSuccessMessages.ROLE_DETAILS_RETRIEVED)
  @ApiOperation({ summary: RoleOperationSummaries.GET_DETAILS })
  @ApiParam({ name: 'id', description: 'Role UUID', type: String })
  @ApiResponse({
    status: 200,
    description: RoleSuccessMessages.ROLE_DETAILS_RETRIEVED,
    schema: {
      type: 'object',
      properties: {
        role: { type: 'object' },
        userCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: RoleApiResponseDescriptions.ROLE_NOT_FOUND,
  })
  async getRoleDetails(@Param('id') id: string): Promise<{
    role: Role;
    userCount: number;
  }> {
    return this.roleService.getRoleWithUserCount(id);
  }

  @Patch(':id')
  // @Roles('ADMIN', 'SUPER_ADMIN')
  @ResponseMessage(RoleSuccessMessages.ROLE_UPDATED)
  @ApiOperation({ summary: RoleOperationSummaries.UPDATE })
  @ApiParam({ name: 'id', description: 'Role UUID', type: String })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: RoleSuccessMessages.ROLE_UPDATED,
    type: Role,
  })
  @ApiResponse({
    status: 404,
    description: RoleApiResponseDescriptions.ROLE_NOT_FOUND,
  })
  @ApiResponse({
    status: 400,
    description: ApiResponseDescriptions.INVALID_DATA,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  // @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(RoleSuccessMessages.ROLE_DELETED)
  @ApiOperation({ summary: RoleOperationSummaries.DELETE })
  @ApiParam({ name: 'id', description: 'Role UUID', type: String })
  @ApiResponse({
    status: 200,
    description: RoleSuccessMessages.ROLE_DELETED,
  })
  @ApiResponse({
    status: 404,
    description: RoleApiResponseDescriptions.ROLE_NOT_FOUND,
  })
  @ApiResponse({
    status: 400,
    description: ApiResponseDescriptions.BAD_REQUEST,
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.roleService.removeRole(id);
  }
}
