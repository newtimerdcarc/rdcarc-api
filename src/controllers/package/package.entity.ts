/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Package {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ length: 500 })
    description: string;

    @Column({ default: 0 })
    quantity: number;

    @Column('json')
    folders: string[];

    @Column('json')
    files: string[];

}
