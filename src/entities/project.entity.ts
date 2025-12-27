import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CollaborationEvent } from './collaboration-event.entity';
import { ProjectFile } from './project-file.entity';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

export interface ProjectMetadata {
  language?: string;
  framework?: string;
  dependencies?: Record<string, string>;
  tags?: string[];
  [key: string]: any;
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

  // Keep metadata as JSONB (no changes)
  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata!: ProjectMetadata;

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

  // Add relations to new entities
  @OneToMany(() => ProjectFile, (file) => file.project, { cascade: true })
  projectFiles!: ProjectFile[];

  @OneToMany(() => CollaborationEvent, (event) => event.project, { cascade: true })
  events!: CollaborationEvent[];
}
