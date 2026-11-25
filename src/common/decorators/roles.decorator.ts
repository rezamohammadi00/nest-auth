import { Reflector } from '@nestjs/core';
import { Role } from '../../config/constants.js';

export const Roles = Reflector.createDecorator<Role[]>(); //usages: @Roles([UserRole.ADMIN])
