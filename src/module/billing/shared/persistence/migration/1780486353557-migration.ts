import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1780486353557 implements MigrationInterface {
  name = 'Migration1780486353557'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "DomainEventsOutbox" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "aggregateType" character varying(100) NOT NULL, "aggregateId" uuid NOT NULL, "eventType" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "published" boolean NOT NULL DEFAULT false, "publishedAt" TIMESTAMP, CONSTRAINT "PK_20a0b1fb76567aae9b2b79f34a7" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "DomainEventsOutbox"`)
  }
}
