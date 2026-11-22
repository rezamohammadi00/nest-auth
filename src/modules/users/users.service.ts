import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.existsBy({
      email: createUserDto.email,
    });

    if (exists) throw new ConflictException('Email already registered');

    const { password, ...rest } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({
      ...rest,
      passwordHash,
    });
    
    return this.usersRepository.save(user);
  }

  findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  findOneByIdWithRefreshTokenHash(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        refreshTokenHash: true,
      },
    });
  }

  setRefreshTokenHash(userId: string, hash: string | null) {
    return this.usersRepository.update(userId, { refreshTokenHash: hash });
  }
}
