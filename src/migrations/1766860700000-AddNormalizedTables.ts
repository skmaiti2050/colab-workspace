import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNormalizedTables1766860700000 implements MigrationInterface {
    name = 'AddNormalizedTables1766860700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const projectFilesExists = await queryRunner.hasTable("project_files");
        if (!projectFilesExists) {
            await queryRunner.query(`
                CREATE TABLE "project_files" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "projectId" uuid NOT NULL,
                    "filePath" character varying(500) NOT NULL,
                    "content" text NOT NULL,
                    "mimeType" character varying(100),
                    "sizeBytes" integer,
                    "createdBy" uuid NOT NULL,
                    "modifiedBy" uuid NOT NULL,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_project_files" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_project_files_path" UNIQUE ("projectId", "filePath")
                )
            `);

            await queryRunner.query(`CREATE INDEX "IDX_project_files_projectId" ON "project_files" ("projectId")`);
            await queryRunner.query(`CREATE INDEX "IDX_project_files_path" ON "project_files" ("projectId", "filePath")`);
            await queryRunner.query(`CREATE INDEX "IDX_project_files_updated" ON "project_files" ("projectId", "updatedAt" DESC)`);

            await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
            await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_created_by" FOREIGN KEY ("createdBy") REFERENCES "users"("id")`);
            await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_modified_by" FOREIGN KEY ("modifiedBy") REFERENCES "users"("id")`);
        }

        const collaborationEventsExists = await queryRunner.hasTable("collaboration_events");
        if (!collaborationEventsExists) {
            await queryRunner.query(`
                CREATE TABLE "collaboration_events" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "projectId" uuid NOT NULL,
                    "userId" uuid NOT NULL,
                    "action" character varying(50) NOT NULL,
                    "resourceType" character varying(50) NOT NULL,
                    "resourceId" character varying(500),
                    "changes" jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_collaboration_events" PRIMARY KEY ("id"),
                    CONSTRAINT "CHK_collaboration_events_action" CHECK ("action" IN ('create', 'update', 'delete', 'rename')),
                    CONSTRAINT "CHK_collaboration_events_resource_type" CHECK ("resourceType" IN ('project', 'file', 'metadata'))
                )
            `);

            await queryRunner.query(`CREATE INDEX "IDX_collaboration_events_project" ON "collaboration_events" ("projectId", "createdAt" DESC)`);
            await queryRunner.query(`CREATE INDEX "IDX_collaboration_events_user" ON "collaboration_events" ("userId", "createdAt" DESC)`);
            await queryRunner.query(`CREATE INDEX "IDX_collaboration_events_action" ON "collaboration_events" ("projectId", "action", "createdAt" DESC)`);

            await queryRunner.query(`ALTER TABLE "collaboration_events" ADD CONSTRAINT "FK_collaboration_events_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
            await queryRunner.query(`ALTER TABLE "collaboration_events" ADD CONSTRAINT "FK_collaboration_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const collaborationEventsExists = await queryRunner.hasTable("collaboration_events");
        if (collaborationEventsExists) {
            await queryRunner.query(`ALTER TABLE "collaboration_events" DROP CONSTRAINT IF EXISTS "FK_collaboration_events_user"`);
            await queryRunner.query(`ALTER TABLE "collaboration_events" DROP CONSTRAINT IF EXISTS "FK_collaboration_events_project"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_collaboration_events_action"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_collaboration_events_user"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_collaboration_events_project"`);
            await queryRunner.query(`DROP TABLE "collaboration_events"`);
        }

        const projectFilesExists = await queryRunner.hasTable("project_files");
        if (projectFilesExists) {
            await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT IF EXISTS "FK_project_files_modified_by"`);
            await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT IF EXISTS "FK_project_files_created_by"`);
            await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT IF EXISTS "FK_project_files_project"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_project_files_updated"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_project_files_path"`);
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_project_files_projectId"`);
            await queryRunner.query(`DROP TABLE "project_files"`);
        }
    }
}