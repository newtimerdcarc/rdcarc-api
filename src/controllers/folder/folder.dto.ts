/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class FolderDto {
    @ApiProperty()
    title: string;

    @ApiProperty()
    package: string;

    @ApiProperty()
    path: string;

    @ApiProperty()
    origin: string;
}

export class UploadFolderPackageDto {
    @ApiProperty()
    titles: string[];

    @ApiProperty()
    package: string;

    @ApiProperty()
    package_name: string;
}

export class UploadFolderInFolderDto {
    @ApiProperty()
    titles: string[];

    @ApiProperty()
    package_id: string;

    @ApiProperty()
    folder_id: string;
}

export class UpdateTitleDto {
    @ApiProperty()
    title: string;
}