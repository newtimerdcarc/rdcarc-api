/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    sip_uuid: string;

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

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    transfer_date: Date;
}
