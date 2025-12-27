import { ApiProperty } from '@nestjs/swagger';
import { CollaborationEventDto } from './project-response.dto';

export class CollaborationHistoryResponseDto {
  @ApiProperty({
    description: 'List of collaboration events',
    type: [CollaborationEventDto],
  })
  events!: CollaborationEventDto[];

  @ApiProperty({
    description: 'Total number of events',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of events per page',
    example: 50,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages!: number;
}

export class UserActivityResponseDto {
  @ApiProperty({
    description: 'List of user collaboration events',
    type: [CollaborationEventDto],
  })
  events!: CollaborationEventDto[];

  @ApiProperty({
    description: 'Total number of events',
    example: 75,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of events per page',
    example: 50,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
  })
  totalPages!: number;
}
