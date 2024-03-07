/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    url: string;

    @Column({ length: 500 })
    description: string;

    @Column()
    creator: string;

    @Column()
    package: string;

    @Column('json')
    date: { year: number, month: number, day: number };

    @Column()
    subject: string;

    @Column()
    type: string;

    @Column()
    size: string;

    @Column()
    resolution: string;

    @Column()
    contributor: string;

    @Column()
    coverage: string;

    @Column()
    format: string;

    @Column()
    identifier: string;

    @Column()
    language: string;

    @Column()
    publisher: string;

    @Column()
    relation: string;

    @Column()
    rights: string;

    @Column()
    source: string;

    @Column()
    typeNew: string;
}