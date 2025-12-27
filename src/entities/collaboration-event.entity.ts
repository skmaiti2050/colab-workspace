import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export type CollaborationAction = 'create' | 'update' | 'delete' | 'rename';
export type ResourceType = 'project' | 'file' | 'metadata';

@Entity('collaboration_events')
@Index(['projectId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['projectId', 'action', 'createdAt'])
export class CollaborationEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  projectId!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    enum: ['create', 'update', 'delete', 'rename'],
  })
  action!: CollaborationAction;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    enum: ['project', 'file', 'metadata'],
  })
  resourceType!: ResourceType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resourceId?: string; // file path or resource identifier

  @Column({ type: 'jsonb', nullable: true })
  changes?: any; // specific change details

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
