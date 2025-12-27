import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobType {
  CODE_EXECUTION = 'code_execution',
  FILE_PROCESSING = 'file_processing',
  WORKSPACE_EXPORT = 'workspace_export',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: JobType,
  })
  type!: JobType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column('jsonb')
  data!: Record<string, any>;

  @Column('jsonb', { nullable: true })
  result!: Record<string, any> | null;

  @Column({ nullable: true, type: 'text' })
  errorMessage!: string | null;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt!: Date | null;
}
