/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class archivematicaDto {
    @ApiProperty()
    user: string;

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

export class deletePackageDto {
    @ApiProperty()
    uuid: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    event_reason: string;

    @ApiProperty()
    user_email: string;
}