/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
export class UserDto {
    @ApiProperty()
    first_name: string;

    @ApiProperty()
    last_name: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    cpf: string;

    @ApiProperty()
    phone: string;
}

export class UpdateUserDto {
    @ApiProperty()
    first_name: string;

    @ApiProperty()
    last_name: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    cpf: string;

    @ApiProperty()
    phone: string;
}

export class UpdatePasswordDto {
    @ApiProperty()
    newPassword: string;
}

export class ConfirmCodeDto {
    @ApiProperty()
    email: string;

    @ApiProperty()
    confirmationCode: string;
}

export class ResendCodeDto {
    @ApiProperty()
    email: string;
}