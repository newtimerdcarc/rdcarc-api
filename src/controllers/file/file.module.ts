/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { FileService } from './file.service';
import { FileProviders } from './file.providers';
import { FileController } from './file.controller';
import { S3Module } from '../s3/s3.module';
import { UserModule } from '../user/user.module';
import { FolderModule } from '../folder/folder.module';
import { PackageModule } from '../package/package.module';
import { DatabaseModule } from 'src/database/database.module';
@Module({
    imports: [
        DatabaseModule,
        S3Module,
        UserModule,
        forwardRef(() => PackageModule),
        forwardRef(() => FolderModule),
    ],
    controllers: [FileController],
    providers: [FileService, ...FileProviders],
    exports: [FileService]
})
export class FileModule { }