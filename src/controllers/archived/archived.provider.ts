/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { Archived } from './archived.entity';

export const ArchivedProviders = [
    {
        provide: 'ARCHIVED_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Archived),
        inject: ['DATA_SOURCE'],
    },
];