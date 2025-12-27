import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateMetadataDto {
  @ApiProperty({
    description: 'Project metadata as key-value pairs',
    example: {
      framework: 'Next.js',
      language: 'TypeScript',
      version: '2.1.0',
      environment: 'production',
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata!: Record<string, any>;
}
