/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class archivematicaDto {
    @ApiProperty()
    username: string;

    @ApiProperty()
    folder: string;
   
}