/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { deletePackageDto } from '../archivematica/archivematica.dto';
import { ArchivematicaService } from '../archivematica/archivematica.service';
import { ArchivalService } from './archival.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('ARQUIVADO')
@ApiBearerAuth()
@Controller('archived')
export class ArchivedController {
    constructor(
        private readonly archivematicaService: ArchivematicaService,
        private readonly archivalService: ArchivalService
    ) { }

    //ARCHIVAL STORAGE
    @UseGuards(JwtAuthGuard)
    @Get('archival')
    @ApiOperation({ summary: 'RETORNA TODOS PACOTES DO ARCHIVAL STORAGE' })
    async findAll(): Promise<any[]> {
        return this.archivalService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('archival/:uuid')
    @ApiOperation({ summary: 'RETORNA APENAS UM PACOTE' })
    async findOneArchival(
        @Param('uuid') uuid: string,
    ): Promise<any> {
        return this.archivalService.findOne(uuid);
    }

    @UseGuards(JwtAuthGuard)
    @Get('aips')
    @ApiOperation({ summary: 'RETORNA TODOS AIPS DO ARCHIVAL STORAGE' })
    async findAIPPackages(): Promise<any[]> {
        return this.archivalService.findAIPPackages();
    }

    @UseGuards(JwtAuthGuard)
    @Get('aips/upload')
    @ApiOperation({ summary: 'RETORNA TODOS AIPS UPLOADED' })
    async findPackagesUploaded(): Promise<any[]> {
        return this.archivalService.findPackagesUploaded();
    }

    @UseGuards(JwtAuthGuard)
    @Get('aips/deleted')
    @ApiOperation({ summary: 'RETORNA TODOS AIPS DELETADOS' })
    async findPackagesDeleted(): Promise<any[]> {
        return this.archivalService.findPackagesDeleted();
    }

    @UseGuards(JwtAuthGuard)
    @Get('aips/reqdel')
    @ApiOperation({ summary: 'RETORNA TODOS AIPS QUE ESTAO PARA SER DELETADOS' })
    async findPackagesReqDel(): Promise<any[]> {
        return this.archivalService.findPackagesReqDel();
    }

    @Post('delete')
    @ApiOperation({ summary: 'DELETAR PACOTE' })
    @ApiBody({ type: deletePackageDto })
    async create(
        @Body() body: deletePackageDto,
    ): Promise<void> {
        await this.archivematicaService.deletePakcage(body);
    }

}