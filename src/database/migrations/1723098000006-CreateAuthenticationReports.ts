import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthenticationReports1723098000006 implements MigrationInterface {
  name = 'CreateAuthenticationReports1723098000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "auth_verdict_enum" AS ENUM (
        'PASS',
        'FAIL',
        'INCONCLUSIVE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "authentication_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "trade_id" uuid NOT NULL,
        "authenticator_id" uuid NOT NULL,
        "verdict" "auth_verdict_enum" NOT NULL,
        "notes" text,
        "photo_hashes" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_authentication_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_authentication_reports_trade_id" UNIQUE ("trade_id"),
        CONSTRAINT "FK_authentication_reports_trade_id" FOREIGN KEY ("trade_id") REFERENCES "trades"("id"),
        CONSTRAINT "FK_authentication_reports_authenticator_id" FOREIGN KEY ("authenticator_id") REFERENCES "users"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "authentication_reports"`);
    await queryRunner.query(`DROP TYPE "auth_verdict_enum"`);
  }
}
