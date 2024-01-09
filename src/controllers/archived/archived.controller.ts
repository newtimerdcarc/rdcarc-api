/* eslint-disable prettier/prettier */
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ArchivedService } from './archived.service';
import { S3Service } from '../s3/s3.service';
@ApiTags('ARQUIVADO')
@ApiBearerAuth()
@Controller('archived')
export class ArchivedController {
    constructor(
        private readonly archivedService: ArchivedService,
        private readonly s3Service: S3Service
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'RETORNA TODOS ARQUIVOS' })
    async basicFindAll(): Promise<any[]> {
        return this.archivedService.basicFindAll();
    }

    @Get(':uuid/one')
    @ApiOperation({ summary: 'RETORNA APENAS UM ARQUIVADO' })
    async findOne(
        @Param('uuid') uuid: string,
    ): Promise<any[]> {
        return this.archivedService.findOne(uuid);
    }

    @Get(':user')
    @ApiOperation({ summary: 'ATUALIZA OS ARQUIVADOS NO BANCO DE DADOS' })
    async findUpdate(
        @Param('user') user: string,
    ): Promise<any[]> {
        return this.archivedService.findUpdate(user);
    }

}