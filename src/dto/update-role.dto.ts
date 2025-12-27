import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entities/workspace-member.entity';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'New role to assign to the user',
    enum: UserRole,
    example: UserRole.COLLABORATOR,
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Role must be owner, collaborator, or viewer' })
  role!: UserRole;
}
