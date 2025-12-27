import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CollaborationHistoryResponseDto,
  CreateCollaborationEventDto,
  UserActivityResponseDto,
} from '../../dto';
import { CollaborationEvent } from '../../entities/collaboration-event.entity';

@Injectable()
export class CollaborationEventService {
  constructor(
    @InjectRepository(CollaborationEvent)
    private readonly eventRepository: Repository<CollaborationEvent>,
  ) {}

  /**
   * Add a new collaboration event
   */
  async addEvent(eventData: CreateCollaborationEventDto): Promise<CollaborationEvent> {
    const event = this.eventRepository.create(eventData);
    return this.eventRepository.save(event);
  }

  /**
   * Get project collaboration history with pagination
   */
  async getProjectHistory(
    projectId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<CollaborationHistoryResponseDto> {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const skip = (validPage - 1) * validLimit;

    const [events, total] = await this.eventRepository.findAndCount({
      where: { projectId },
      order: { createdAt: 'DESC' },
      skip,
      take: validLimit,
      relations: ['user'],
    });

    const totalPages = Math.ceil(total / validLimit);

    const transformedEvents = events.map((event) => ({
      userId: event.userId,
      action: event.action,
      timestamp: event.createdAt,
      changes: event.changes,
      filePath: event.resourceId,
    }));

    return {
      events: transformedEvents,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Get user activity across all projects with pagination
   */
  async getUserActivity(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<UserActivityResponseDto> {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const skip = (validPage - 1) * validLimit;

    const [events, total] = await this.eventRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: validLimit,
      relations: ['project'],
    });

    const totalPages = Math.ceil(total / validLimit);

    const transformedEvents = events.map((event) => ({
      userId: event.userId,
      action: event.action,
      timestamp: event.createdAt,
      changes: event.changes,
      filePath: event.resourceId,
    }));

    return {
      events: transformedEvents,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }
}
