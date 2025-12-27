import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entities/workspace-member.entity';

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'colleague@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    enum: UserRole,
    example: UserRole.COLLABORATOR,
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Role must be owner, collaborator, or viewer' })
  role!: UserRole;
}
