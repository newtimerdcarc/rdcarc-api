/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { S3Service } from './s3.service';
import { PackageModule } from '../package/package.module';
import { FileModule } from '../file/file.module';
import { FolderModule } from '../folder/folder.module';
import { ArchivedModule } from '../archived/archived.module';
@Module({
    imports: [
        forwardRef(() => FileModule),
        forwardRef(() => ArchivedModule),
        forwardRef(() => FolderModule),
        forwardRef(() => PackageModule)
    ],
    controllers: [],
    providers: [S3Service],
    exports: [S3Service]
})
export class S3Module { }
