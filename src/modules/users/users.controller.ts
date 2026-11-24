import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../config/constants.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles([Role.ADMIN])
  getUsers() {
    return this.usersService.list();
  }
}
