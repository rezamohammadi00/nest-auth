import { IsEmail, IsStrongPassword } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @Transform(({ value }) =>
    // before validation
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  readonly email: string;

  @IsStrongPassword()
  @ApiProperty({
    default: 'Passw0rd!',
    description:
      'Password must be at least 8 characters and include at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  })
  readonly password: string;
}
