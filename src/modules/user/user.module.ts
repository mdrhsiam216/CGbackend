import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/entities/role.entity';
import { RoleRepository } from '../role/repository/role.repository';
import { UserRole } from '../user-role/entities/user-role.entity';
import { UserRoleRepository } from '../user-role/repository/user-role.repository';
import { User } from './entities/user.entity';
import { UserRepository } from './repository/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRoleModule } from '../user-role/user-role.module';
import { RoleModule } from '../role/role.module';
import { CustomLogger } from '../../shared/services/custom-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole]),
    RoleModule,
    UserRoleModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    RoleRepository,
    UserRoleRepository,
    {
      provide: 'ILogger',
      useClass: CustomLogger,
    },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
