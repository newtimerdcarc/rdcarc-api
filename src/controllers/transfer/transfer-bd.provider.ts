/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';

export const TransferBdProvider = {
    provide: 'TRANFERS',
    useFactory: (dataSource: DataSource) => ({
        query: async (queryString: string, parameters?: any[]) =>
            dataSource.query(queryString, parameters),
    }),
    inject: ['TRANSFERS'],
};
