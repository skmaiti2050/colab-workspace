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
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('project_files')
@Index(['projectId'])
@Index(['projectId', 'filePath'], { unique: true })
@Index(['projectId', 'updatedAt'])
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  projectId!: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  filePath!: string;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'integer', nullable: true })
  sizeBytes?: number;

  @Column({ type: 'uuid', nullable: false })
  createdBy!: string;

  @Column({ type: 'uuid', nullable: false })
  modifiedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'modifiedBy' })
  modifier!: User;
}
