/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { FolderService } from './folder.service';
import { FolderProviders } from './folder.providers';
import { FolderController } from './folder.controller';
import { PackageModule } from '../package/package.module';
import { FileModule } from '../file/file.module';
import { S3Module } from '../s3/s3.module';
@Module({
    imports: [
        S3Module,
        DatabaseModule,
        forwardRef(() => PackageModule),
        forwardRef(() => FileModule),
    ],
    controllers: [FolderController],
    providers: [FolderService, ...FolderProviders],
    exports: [FolderService]
})
export class FolderModule { }