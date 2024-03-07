/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
    @ApiProperty({ type: 'string', format: 'binary', required: false })
    file: string

    @ApiProperty()
    package: string;

    @ApiProperty()
    path: string;
    
    @ApiProperty()
    creator: string;
}

export class UpdateFileDto {
    @ApiProperty()
    title: string;

    @ApiProperty()
    subject: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    creator: string;

    @ApiProperty()
    date: string;

    @ApiProperty()
    resolution: string;

    @ApiProperty()
    contributor: string;

    @ApiProperty()
    coverage: string;

    @ApiProperty()
    format: string;

    @ApiProperty()
    identifier: string;

    @ApiProperty()
    language: string;

    @ApiProperty()
    publisher: string;

    @ApiProperty()
    relation: string;

    @ApiProperty()
    rights: string;

    @ApiProperty()
    source: string;

    @ApiProperty()
    typeNew: string;
}