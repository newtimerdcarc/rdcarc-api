/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ArchivedService } from './archived.service';
import { deletePackageDto } from '../archivematica/archivematica.dto';
import { ArchivematicaService } from '../archivematica/archivematica.service';
@ApiTags('ARQUIVADO')
@ApiBearerAuth()
@Controller('archived')
export class ArchivedController {
    constructor(
        private readonly archivedService: ArchivedService,
        private readonly archivematicaService: ArchivematicaService
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

    @Get('findUpdate')
    @ApiOperation({ summary: 'ATUALIZA OS ARQUIVADOS NO BANCO DE DADOS' })
    async findUpdate(): Promise<any[]> {
        return this.archivedService.findUpdate();
    }

    @Post('delete')
    @ApiOperation({ summary: 'DELETAR PACOTE' })
    @ApiBody({ type: deletePackageDto })
    async create(
        @Body() body: deletePackageDto,
    ): Promise<void> {
        const packageFound = await this.archivematicaService.deletePakcage(body);
        if (packageFound) {
            await this.archivedService.afterDeletePackage(body.uuid);
        }
    }

}