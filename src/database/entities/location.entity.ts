import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('locations')
@Unique('locations_name_coordinates_unique', ['name', 'x', 'y'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text')
  type!: string;

  @Column('double precision')
  radius!: number;

  @Column('double precision')
  x!: number;

  @Column('double precision')
  y!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
