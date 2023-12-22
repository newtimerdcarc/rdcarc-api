/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { Package } from './package.entity';

export const PackageProviders = [
    {
        provide: 'PACKAGE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Package),
        inject: ['DATA_SOURCE'],
    },
];