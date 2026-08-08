import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWatches1723098000003 implements MigrationInterface {
  name = 'CreateWatches1723098000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "watch_condition_enum" AS ENUM ('NEW', 'EXCELLENT', 'VERY_GOOD', 'GOOD')
    `);
    await queryRunner.query(`
      CREATE TYPE "watch_status_enum" AS ENUM ('LISTED', 'UNLISTED', 'SOLD')
    `);
    await queryRunner.query(`
      CREATE TABLE "watches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reference_number" character varying NOT NULL,
        "serial_number" character varying NOT NULL,
        "brand" character varying NOT NULL,
        "model" character varying NOT NULL,
        "asking_price" numeric(12,2) NOT NULL,
        "condition" "watch_condition_enum" NOT NULL,
        "photos" jsonb NOT NULL DEFAULT '[]',
        "status" "watch_status_enum" NOT NULL DEFAULT 'LISTED',
        "seller_id" uuid NOT NULL,
        "passport_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_watches_reference_number" UNIQUE ("reference_number"),
        CONSTRAINT "UQ_watches_serial_number" UNIQUE ("serial_number"),
        CONSTRAINT "PK_watches_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_watches_seller_id" FOREIGN KEY ("seller_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_watches_status" ON "watches" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_watches_status"`);
    await queryRunner.query(`DROP TABLE "watches"`);
    await queryRunner.query(`DROP TYPE "watch_status_enum"`);
    await queryRunner.query(`DROP TYPE "watch_condition_enum"`);
  }
}
