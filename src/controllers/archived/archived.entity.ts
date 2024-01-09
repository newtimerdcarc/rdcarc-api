/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Archived {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    title: string;

    @Column()
    current_full_path: string;

    @Column()
    current_location: string;

    @Column()
    current_path: string;

    @Column()
    encrypted: boolean;

    @Column('json')
    misc_attributes: Record<string, any>;

    @Column()
    origin_pipeline: string;

    @Column()
    package_type: string;

    @Column('json')
    related_packages: string[];

    @Column('json')
    replicas: string[];

    @Column({ type: 'json', nullable: true })
    replicated_package: Record<string, any> | null;

    @Column()
    resource_uri: string;

    @Column()
    size: number;

    @Column()
    status: string;

    @Column()
    stored_date: string;
}
