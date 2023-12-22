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

export class UpdateTitleDto {
    @ApiProperty()
    title: string;
}