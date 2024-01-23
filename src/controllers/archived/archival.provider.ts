/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';

export const ArchivalProvider = {
    provide: 'LOCATIONS_PACKAGE_REPOSITORY',
    useFactory: (dataSource: DataSource) => ({
        query: async (queryString: string, parameters?: any[]) =>
            dataSource.query(queryString, parameters),
    }),
    inject: ['ARCHIVEMATICA'],
};
