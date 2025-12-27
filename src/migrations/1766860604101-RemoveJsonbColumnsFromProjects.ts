import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveJsonbColumnsFromProjects1766860604101 implements MigrationInterface {
    name = 'RemoveJsonbColumnsFromProjects1766860604101'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "files"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "collaborationHistory"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "files" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "collaborationHistory" jsonb NOT NULL DEFAULT '[]'`);
    }

}
