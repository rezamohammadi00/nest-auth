import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Env } from '../../../config/env.schema.js';
import type { JwtPayload } from '../../../common/types/jwt-payload.type.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private config: ConfigService<Env, true>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(Public, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token)
      throw new UnauthorizedException('Missing token');

    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}
