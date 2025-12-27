import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJobsTable1766872734689 implements MigrationInterface {
    name = 'CreateJobsTable1766872734689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_type_enum" AS ENUM('code_execution', 'file_processing', 'workspace_export')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."jobs_type_enum" NOT NULL, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'pending', "data" jsonb NOT NULL, "result" jsonb, "errorMessage" text, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_2d210533bd8823b36702a26dd43" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_2d210533bd8823b36702a26dd43"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_type_enum"`);
    }

}
