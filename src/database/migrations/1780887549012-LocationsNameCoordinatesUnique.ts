import { MigrationInterface, QueryRunner } from 'typeorm';

export class LocationsNameCoordinatesUnique1780887549012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE locations
      ADD CONSTRAINT locations_name_coordinates_unique UNIQUE (name, x, y)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE locations
      DROP CONSTRAINT IF EXISTS locations_name_coordinates_unique
    `);
  }
}
