import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePassport1723098000005 implements MigrationInterface {
  name = 'CreatePassport1723098000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "ledger_entry_type_enum" AS ENUM (
        'AUTHENTICATED',
        'SERVICED',
        'TRANSFERRED',
        'RE_AUTHENTICATED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "passports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "serial_number" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_passports_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_passports_serial_number" UNIQUE ("serial_number")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ledger_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "passport_id" uuid NOT NULL,
        "type" "ledger_entry_type_enum" NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "prev_hash" character varying(64) NOT NULL,
        "this_hash" character varying(64) NOT NULL,
        "signature" character varying(128) NOT NULL,
        "signer" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledger_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ledger_entries_passport_id" FOREIGN KEY ("passport_id") REFERENCES "passports"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_entries_passport_id_created_at"
      ON "ledger_entries" ("passport_id", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "watches"
      ADD CONSTRAINT "FK_watches_passport_id"
      FOREIGN KEY ("passport_id") REFERENCES "passports"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "watches" DROP CONSTRAINT "FK_watches_passport_id"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_ledger_entries_passport_id_created_at"
    `);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(`DROP TABLE "passports"`);
    await queryRunner.query(`DROP TYPE "ledger_entry_type_enum"`);
  }
}
