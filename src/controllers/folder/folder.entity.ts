/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Folder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    package: string;

    @Column()
    path: string;

    @Column()
    origin: string;

    @Column('json')
    date: { year: number, month: number, day: number };

    @Column('json')
    folders: string[];

    @Column('json')
    files: string[];

}
