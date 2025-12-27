import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entities/workspace-member.entity';

export class InviteUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Role must be owner, collaborator, or viewer' })
  role!: UserRole;
}
