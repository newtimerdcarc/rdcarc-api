/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PackageService } from './package.service';
import { PackageProviders } from './package.providers';
import { PackageController } from './package.controller';
import { FolderModule } from '../folder/folder.module';
import { FileModule } from '../file/file.module';
@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => FolderModule),
        forwardRef(() => FileModule),
    ],
    controllers: [PackageController],
    providers: [PackageService, ...PackageProviders],
    exports: [PackageService]
})
export class PackageModule { }