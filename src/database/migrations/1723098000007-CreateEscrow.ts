import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEscrow1723098000007 implements MigrationInterface {
  name = 'CreateEscrow1723098000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "escrow_hold_status_enum" AS ENUM (
        'HELD',
        'RELEASED',
        'REFUNDED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "escrow_holds" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "trade_id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "seller_id" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" "escrow_hold_status_enum" NOT NULL DEFAULT 'HELD',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_escrow_holds_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_escrow_holds_trade_id" UNIQUE ("trade_id"),
        CONSTRAINT "FK_escrow_holds_trade_id" FOREIGN KEY ("trade_id") REFERENCES "trades"("id"),
        CONSTRAINT "FK_escrow_holds_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_escrow_holds_seller_id" FOREIGN KEY ("seller_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "idempotency_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "idempotency_key" character varying NOT NULL,
        "request_hash" character varying(64) NOT NULL,
        "response_body" jsonb NOT NULL,
        "trade_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_idempotency_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_idempotency_records_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "FK_idempotency_records_trade_id" FOREIGN KEY ("trade_id") REFERENCES "trades"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "idempotency_records"`);
    await queryRunner.query(`DROP TABLE "escrow_holds"`);
    await queryRunner.query(`DROP TYPE "escrow_hold_status_enum"`);
  }
}
