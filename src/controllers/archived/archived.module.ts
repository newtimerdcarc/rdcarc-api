/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ArchivedProviders } from './archived.provider';
import { ArchivematicaModule } from '../archivematica/archivematica.module';
import { S3Module } from '../s3/s3.module';
import { ArchivedController } from './archived.controller';
import { ArchivedService } from './archived.service';
import { ArchivalService } from './archival.service';
import { ArchivalProvider } from './archival.provider';
@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => S3Module),
        forwardRef(() => ArchivematicaModule),
    ],
    controllers: [ArchivedController],
    providers: [ArchivedService, ArchivalService, ArchivalProvider, ...ArchivedProviders],
    exports: [ArchivedService, ArchivalService]
})
export class ArchivedModule { }