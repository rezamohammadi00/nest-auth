import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Env } from '../../config/env.schema.js';
import { JwtPayload } from '../../common/types/jwt-payload.type.js';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/entities/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwt: JwtService,
    private config: ConfigService<Env, true>,
  ) {}

  private preHash(token: string) {
    return createHash('sha256').update(token).digest('base64');
  }

  private async issueTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_TOKEN_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TOKEN_EXPIRES', { infer: true }),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_TOKEN_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_TOKEN_EXPIRES', {
          infer: true,
        }),
      }),
    ]);

    await this.usersService.setRefreshTokenHash(
      user.id,
      await bcrypt.hash(this.preHash(refreshToken), 10),
    );

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmailWithPassword(
      loginDto.email,
    );

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.config.get('JWT_REFRESH_TOKEN_SECRET', { infer: true }),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOneByIdWithRefreshTokenHash(
      payload.sub,
    );

    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(
        this.preHash(refreshTokenDto.refreshToken),
        user.refreshTokenHash,
      ))
    ) {
      throw new ForbiddenException('Refresh token revoked');
    }
    return this.issueTokens(user);
  }

  logout(userId: string) {
    return this.usersService.setRefreshTokenHash(userId, null);
  }

  getProfile(userId: string) {
    return this.usersService.findOneById(userId);
  }
}
