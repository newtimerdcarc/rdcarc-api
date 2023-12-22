/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Put, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdatePasswordDto, UpdateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('USUÁRIO')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'CRIAR USUÁRIO' })
  @ApiBody({ type: UserDto })
  async create(
    @Body() body: User,
  ): Promise<User> {
    return this.userService.create(body);
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
  @Delete(':id')
  @ApiOperation({ summary: 'DELETAR USUÁRIO' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

}