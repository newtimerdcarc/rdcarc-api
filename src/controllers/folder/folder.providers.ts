/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import { Folder } from './folder.entity';

export const FolderProviders = [
    {
        provide: 'FOLDER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Folder),
        inject: ['DATA_SOURCE'],
    },
];