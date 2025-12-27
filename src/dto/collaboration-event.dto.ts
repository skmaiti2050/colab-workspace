import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CursorPosition {
  @ApiProperty({
    description: 'Line number (0-based)',
    example: 15,
  })
  @IsNumber()
  @IsNotEmpty()
  line!: number;

  @ApiProperty({
    description: 'Column number (0-based)',
    example: 8,
  })
  @IsNumber()
  @IsNotEmpty()
  column!: number;
}

export class FileChangeDto {
  @ApiProperty({
    description: 'Workspace ID where the file change occurred',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({
    description: 'Project ID where the file change occurred',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Path of the file that was changed',
    example: '/src/components/Button.tsx',
  })
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @ApiProperty({
    description: 'Mock payload representing file changes',
    example: {
      operation: 'insert',
      position: { line: 10, column: 5 },
      content: 'console.log("Hello World");',
      length: 26,
    },
  })
  @IsObject()
  changes!: any;
}

export class CursorUpdateDto {
  @ApiProperty({
    description: 'Workspace ID where the cursor update occurred',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({
    description: 'Project ID where the cursor update occurred',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Cursor position in the file',
    example: { line: 15, column: 8 },
  })
  @ValidateNested()
  @Type(() => CursorPosition)
  position!: CursorPosition;
}

export class JoinWorkspaceDto {
  @ApiProperty({
    description: 'Workspace ID to join',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId!: string;
}

export class UserPresenceDto {
  @ApiProperty({
    description: 'User ID',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Username or email',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: 'Timestamp of the event',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  timestamp!: Date;
}
