import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoUsers1723098000002 implements MigrationInterface {
  name = 'SeedDemoUsers1723098000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = '$2b$10$Hcw.ElOSqp09rgmsStlaUO/HjOHirCMBpyfWQISp5TlI6liZ07DwG';

    await queryRunner.query(
      `
      INSERT INTO "users" ("email", "password_hash", "roles")
      VALUES
        ('seller@demo.com', $1, 'SELLER'),
        ('buyer@demo.com', $1, 'BUYER'),
        ('authenticator@demo.com', $1, 'AUTHENTICATOR')
      ON CONFLICT ("email") DO NOTHING
      `,
      [passwordHash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM "users"
      WHERE "email" IN (
        'seller@demo.com',
        'buyer@demo.com',
        'authenticator@demo.com'
      )
      `,
    );
  }
}
