/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ArchivedProviders } from './archived.provider';
import { ArchivematicaModule } from '../archivematica/archivematica.module';
import { S3Module } from '../s3/s3.module';
import { ArchivedController } from './archived.controller';
import { ArchivedService } from './archived.service';
@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => S3Module),
        // forwardRef(() => FolderModule),
        forwardRef(() => ArchivematicaModule),
    ],
    controllers: [ArchivedController],
    providers: [ArchivedService, ...ArchivedProviders],
    exports: [ArchivedService]
})
export class ArchivedModule { }