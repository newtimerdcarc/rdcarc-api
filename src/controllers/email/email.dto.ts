/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    cpf: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    message: string;
}