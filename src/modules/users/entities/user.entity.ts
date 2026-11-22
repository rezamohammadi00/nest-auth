import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude({ toPlainOnly: true })
  refreshTokenHash: string | null;

  // 1. Never selected from DB by default
  @Column({ select: false })
  // 2. Hidden during serialization even if it gets selected/loaded
  @Exclude({ toPlainOnly: true }) // Hides it ONLY when converting class -> plain (HTTP response)
  passwordHash: string;
}

//when the passwordHash is showing?

//1) QueryBuilder + addSelect() :
// const user = await userRepository.findOne({
//   where: { email: loginDto.email },
//   select: {
//     id: true,
//     email: true,
//     name: true,
//     passwordHash: true,
//   },
// });

//2 findOne() + select.passwordHash: true :
//  const user = await this.userRepository.findOne({
//     where: { email },
//     select: {
//       id: true,
//       email: true,
//       name: true,
//       passwordHash: true,
//     },
//   });
