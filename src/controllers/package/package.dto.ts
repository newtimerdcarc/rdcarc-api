/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class PackageDto {
    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;
}