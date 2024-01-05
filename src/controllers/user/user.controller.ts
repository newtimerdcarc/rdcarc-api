/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Put, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ConfirmCodeDto, ResendCodeDto, UpdatePasswordDto, UpdateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { S3Service } from '../s3/s3.service';
@ApiTags('USUÁRIO')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'CRIAR USUÁRIO' })
  @ApiBody({ type: UserDto })
  async create(
    @Body() body: User,
  ): Promise<User> {
    return this.userService.create(body);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'CONFIRMAR USUÁRIO COGNITO' })
  @ApiBody({ type: ConfirmCodeDto })
  async confirmUser(
    @Body() body: ConfirmCodeDto,
  ): Promise<User> {
    const { email, confirmationCode } = body;
    return this.userService.confirmUser(email, confirmationCode);
  }

  @Post('resend')
  @ApiOperation({ summary: 'ENVIA OUTRO CÓDIGO COGNITO' })
  @ApiBody({ type: ResendCodeDto })
  async resendCode(
    @Body() body: ResendCodeDto,
  ): Promise<User> {
    const { email } = body;
    return this.s3Service.resendConfirmationCode(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'TODOS USUÁRIOS' })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'BUSCAR USUÁRIO VIA ID' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'EDITAR USUÁRIO' })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/password')
  @ApiOperation({ summary: 'ATUALIZAR SENHA DO USUÁRIO' })
  @ApiBody({ type: UpdatePasswordDto })
  async updatePassword(@Param('id') id: string, @Body('newPassword') newPassword: string): Promise<any> {
    return this.userService.updatePassword(id, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/block')
  @ApiOperation({ summary: 'BLOQUEAR USUÁRIO' })
  async blockUser(@Param('id') id: string): Promise<any> {
    return this.userService.blockUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/unblock')
  @ApiOperation({ summary: 'DESBLOQUEAR USUÁRIO' })
  async unblockUser(@Param('id') id: string): Promise<any> {
    return this.userService.unblockUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/first')
  @ApiOperation({ summary: 'PRIMEIRO LOGIN' })
  async firstLogin(@Param('id') id: string): Promise<any> {
    return this.userService.firstLogin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/:user/archivematica')
  @ApiOperation({ summary: 'ALTERAR USER ARCHIVEMATICA' })
  async setUserArchiv(
    @Param('id') id: string,
    @Param('user') user: string,
  ): Promise<any> {
    return this.userService.setUserArchiv(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'DELETAR USUÁRIO' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

}