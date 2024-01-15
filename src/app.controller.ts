/* eslint-disable prettier/prettier */
import { Controller, Get, UseGuards, Post, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { LoginDto } from './login.dto';
@ApiTags('API')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthcheck')
  healthcheck() {
    try {
    } catch (error) {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'LOGIN PADRÃO' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return req.user;
  }

}