/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    user: string;

    @Column()
    type: string;

    @Column()
    path: string;

    @Column()
    directory: string;

    @Column()
    name: string;

    @Column()
    microservice: string;

    @Column()
    status: string;

    @Column()
    message: string;
}
