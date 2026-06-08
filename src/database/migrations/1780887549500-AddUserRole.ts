import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1780887549500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'client', 'guest')
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN role user_role NOT NULL DEFAULT 'client'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN role`);
    await queryRunner.query(`DROP TYPE user_role`);
  }
}
