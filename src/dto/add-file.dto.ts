import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddFileDto {
  @ApiProperty({
    description: 'File path within the project',
    example: 'src/components/Button.tsx',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'File path is required' })
  @IsString({ message: 'File path must be a string' })
  @MaxLength(500, { message: 'File path cannot exceed 500 characters' })
  path!: string;

  @ApiProperty({
    description: 'File content as a string',
    example:
      'import React from "react";\n\nexport const Button = () => {\n  return <button>Click me</button>;\n};',
  })
  @IsNotEmpty({ message: 'File content is required' })
  @IsString({ message: 'File content must be a string' })
  content!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'text/plain',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'MIME type must be a string' })
  @MaxLength(100, { message: 'MIME type cannot exceed 100 characters' })
  mimeType?: string;
}
