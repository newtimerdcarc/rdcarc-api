/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { ArchivematicaService } from './archivematica.service';
import { S3Module } from '../s3/s3.module';
import { FolderModule } from '../folder/folder.module';
import { DatabaseModule } from 'src/database/database.module';
import { TransferProviders } from './transfer.provider';
import { TransferController } from './transfer.controller';
import { ArchivedModule } from '../archived/archived.module';
@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => S3Module),
        forwardRef(() => FolderModule),
        forwardRef(() => ArchivedModule),
    ],
    controllers: [TransferController],
    providers: [ArchivematicaService, ...TransferProviders],
    exports: [ArchivematicaService]
})
export class ArchivematicaModule { }