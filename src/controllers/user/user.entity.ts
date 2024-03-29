/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  type: string;

  @Column()
  cpf: string;

  @Column()
  phone: string;

  @Column({ default: "" })
  api_key: string;

  @Column({ default: "" })
  storage_key: string;

  @Column({ default: "" })
  user_archivematica: string;

  @Column({ default: true })
  first_login: boolean;

  @Column({ default: true })
  active: boolean;
}
