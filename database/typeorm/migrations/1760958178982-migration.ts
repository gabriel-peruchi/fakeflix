import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1760958178982 implements MigrationInterface {
  name = 'Migration1760958178982'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Movie" ADD "externalRating" double precision`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Movie" DROP COLUMN "externalRating"`)
  }
}
