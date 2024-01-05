/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { Transfer } from './transfer.entity';

export const TransferProviders = [
    {
        provide: 'TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Transfer),
        inject: ['DATA_SOURCE'],
    },
];