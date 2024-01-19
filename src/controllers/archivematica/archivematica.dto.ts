/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class archivematicaDto {
    @ApiProperty()
    username: string;

    @ApiProperty()
    apiKey: string;

    @ApiProperty()
    folder: string;
}
export class transferStatusDto {
    @ApiProperty()
    username: string;

    @ApiProperty()
    uuid: string;
}
export class filenameUrlDto {
    @ApiProperty()
    filename: string;
}
export class filePathDto {
    @ApiProperty()
    folderPath: string;
}