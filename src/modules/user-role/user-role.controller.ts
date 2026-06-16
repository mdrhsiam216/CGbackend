import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  UserRoleSuccessMessages,
  UserRoleOperationSummaries,
  UserRoleResponseMessages,
  ApiResponseDescriptions,
  UserRoleApiResponseDescriptions,
} from '../../shared/enums';
import { UserRoleService } from './user-role.service';
import { Role } from '../role/entities/role.entity';

@ApiTags('user-roles')
@ApiBearerAuth()
@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get(':userId')
  @ResponseMessage(UserRoleSuccessMessages.USER_ROLES_RETRIEVED)
  @ApiOperation({ summary: UserRoleOperationSummaries.GET_USER_ROLES })
  @ApiParam({ name: 'userId', description: 'User UUID', type: String })
  @ApiResponse({
    status: 200,
    description: UserRoleSuccessMessages.USER_ROLES_RETRIEVED,
    type: [Role],
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async getUserRoles(@Param('userId') userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Post(':userId')
  @ResponseMessage(UserRoleSuccessMessages.ROLES_ASSIGNED)
  @ApiOperation({ summary: UserRoleOperationSummaries.ASSIGN_ROLES })
  @ApiParam({ name: 'userId', description: 'User UUID', type: String })
  @ApiBody({
    description: 'Array of roles to assign',
    type: [Role],
    examples: {
      example1: {
        summary: 'Assign multiple roles',
        value: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'ADMIN' },
          { id: '223e4567-e89b-12d3-a456-426614174001', name: 'USER' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: UserRoleSuccessMessages.ROLES_ASSIGNED,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: UserRoleResponseMessages.ROLES_ASSIGNED,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiBadRequestResponse({
    description: UserRoleApiResponseDescriptions.INVALID_ROLE_DATA,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async assignRoles(@Param('userId') userId: string, @Body() roles: Role[]) {
    await this.userRoleService.bulkAssignRoles(userId, roles);
    return { message: 'Roles assigned successfully.' };
  }

  @Delete(':userId')
  @ResponseMessage(UserRoleSuccessMessages.ROLES_REMOVED)
  @ApiOperation({ summary: UserRoleOperationSummaries.REMOVE_ROLES })
  @ApiParam({ name: 'userId', description: 'User UUID', type: String })
  @ApiResponse({
    status: 200,
    description: UserRoleSuccessMessages.ROLES_REMOVED,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: UserRoleResponseMessages.ROLES_REMOVED,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: ApiResponseDescriptions.USER_NOT_FOUND,
  })
  @ApiUnauthorizedResponse({
    description: ApiResponseDescriptions.UNAUTHORIZED,
  })
  async removeRoles(@Param('userId') userId: string) {
    await this.userRoleService.removeRolesByUserId(userId);
    return { message: 'Roles removed successfully.' };
  }
}
