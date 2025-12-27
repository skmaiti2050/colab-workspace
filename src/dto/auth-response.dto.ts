import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;
}

export class UserRegistrationUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTNkZjY1Mi04ZWViLTRhNDEtOWVjOS00ZmUwMzk0MmI3N2IiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzA1MzE0NjAwLCJleHAiOjE3MDUzMTgyMDB9.example-signature',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTNkZjY1Mi04ZWViLTRhNDEtOWVjOS00ZmUwMzk0MmI3N2IiLCJ0b2tlbklkIjoiYWJjZGVmZ2gtaWprbC1tbm9wLXFyc3QtdXZ3eHl6MTIzNDU2IiwiaWF0IjoxNzA1MzE0NjAwLCJleHAiOjE3MDU5MTk0MDB9.example-refresh-signature',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'User profile information',
    type: UserProfileDto,
    example: {
      id: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
  })
  user!: UserProfileDto;
}

export class UserRegistrationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User registered successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Created user information',
    type: UserRegistrationUserDto,
    example: {
      id: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  })
  user!: UserRegistrationUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Logged out successfully',
  })
  message!: string;
}
