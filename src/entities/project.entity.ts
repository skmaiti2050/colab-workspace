import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

export interface ProjectFile {
  path: string;
  content: string;
  mimeType: string;
  lastModified: Date;
  modifiedBy: string;
}

export interface ProjectMetadata {
  language?: string;
  framework?: string;
  dependencies?: Record<string, string>;
  tags?: string[];
  [key: string]: any;
}

export interface CollaborationEvent {
  userId: string;
  action: 'create' | 'update' | 'delete' | 'rename';
  timestamp: Date;
  changes: any;
  filePath?: string;
}

@Entity('projects')
@Index(['workspaceId'])
@Index(['createdBy'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  workspaceId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(2, { message: 'Project name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  createdBy!: string;

  @Column({
    type: 'jsonb',
    default: [],
  })
  files!: ProjectFile[];

  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata!: ProjectMetadata;

  @Column({
    type: 'jsonb',
    default: [],
  })
  collaborationHistory!: CollaborationEvent[];

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Workspace, (workspace) => workspace.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;
}
