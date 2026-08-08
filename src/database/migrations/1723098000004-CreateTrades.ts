import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrades1723098000004 implements MigrationInterface {
  name = 'CreateTrades1723098000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "trade_state_enum" AS ENUM (
        'DRAFT',
        'PENDING_AUTH',
        'AUTH_PASSED',
        'AUTH_FAILED',
        'ESCROW_FUNDED',
        'SHIPPED',
        'DELIVERED',
        'DISPUTED',
        'RELEASED',
        'REFUNDED_PRE_SHIP',
        'REFUNDED_POST_DELIVERY',
        'EXPIRED',
        'CANCELLED',
        'LOST_IN_TRANSIT'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trades" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "watch_id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "seller_id" uuid NOT NULL,
        "state" "trade_state_enum" NOT NULL DEFAULT 'DRAFT',
        "gross_amount" numeric(12,2) NOT NULL,
        "commission_amount" numeric(12,2) NOT NULL,
        "net_payout" numeric(12,2) NOT NULL,
        "escrow_deadline" TIMESTAMP WITH TIME ZONE,
        "shipment_sla_deadline" TIMESTAMP WITH TIME ZONE,
        "dispute_window_ends" TIMESTAMP WITH TIME ZONE,
        "tracking_number" character varying,
        "dispute_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trades_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trades_watch_id" FOREIGN KEY ("watch_id") REFERENCES "watches"("id"),
        CONSTRAINT "FK_trades_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_trades_seller_id" FOREIGN KEY ("seller_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_one_active_trade_per_watch"
      ON "trades" ("watch_id")
      WHERE "state" NOT IN (
        'AUTH_FAILED',
        'RELEASED',
        'REFUNDED_PRE_SHIP',
        'REFUNDED_POST_DELIVERY',
        'EXPIRED',
        'CANCELLED',
        'LOST_IN_TRANSIT'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_one_active_trade_per_watch"`);
    await queryRunner.query(`DROP TABLE "trades"`);
    await queryRunner.query(`DROP TYPE "trade_state_enum"`);
  }
}
