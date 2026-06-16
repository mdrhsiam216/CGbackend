import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';
import { UserRoleService } from './user-role.service';
import { UserRoleRepository } from './repository/user-role.repository';
import { UserRoleController } from './user-role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole])],
  providers: [UserRoleService, UserRoleRepository],
  controllers: [UserRoleController],
  exports: [UserRoleService],
})
export class UserRoleModule {}
