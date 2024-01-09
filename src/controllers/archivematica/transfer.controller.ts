/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { archivematicaDto, filePathDto, filenameUrlDto } from '../archivematica/archivematica.dto';
import { ArchivematicaService } from '../archivematica/archivematica.service';
import { S3Service } from '../s3/s3.service';
import { Transfer } from './transfer.entity';
@ApiTags('ARCHIVEMATICA')
@Controller('transfer')
export class TransferController {
    constructor(
        private readonly archService: ArchivematicaService,
        private readonly s3Service: S3Service
    ) { }

    @Get()
    @ApiOperation({ summary: 'TODOS TRANSFERS REALIZADOS' })
    async findAll(): Promise<any[]> {
        return this.archService.findAll();
    }

    @Get(':user/packages')
    @ApiOperation({ summary: 'BUSCAR TODOS OS PACOTES NO ARCHIVEMATICA' })
    async getAllPackages(@Param('user') user: string): Promise<any> {
        return this.archService.getAllPackages(user);
    }

    @Get(':user/:id/details')
    @ApiOperation({ summary: 'BUSCAR UM PACOTE ESPECÍFICO' })
    async getFileDetails(
        @Param('user') user: string,
        @Param('id') id: string
    ): Promise<any> {
        return this.archService.getFileDetails(user, id);
    }

    @Post()
    @ApiOperation({ summary: 'CRIA A TRANSFER NO BANCO' })
    @ApiBody({ type: Transfer })
    async regisTransfer(
        @Body() body: any,
    ): Promise<any> {
        return this.archService.create(body);
    }

    @Post('downloadAip')
    @ApiOperation({ summary: 'RETORNA A URL PARA DOWNLOAD DE UM ARQUIVO DO AIP' })
    async aipDownload(
        @Body() body: filenameUrlDto
    ): Promise<any> {
        const { filename } = body;
        return this.s3Service.generateAipPresignedUrl(filename);
    }

    @Post('downloadDip')
    @ApiOperation({ summary: 'RETORNA A URL PARA DOWNLOAD DE UM ARQUIVO DIP' })
    async dipDownload(
        @Body() body: filenameUrlDto
    ): Promise<any> {
        const { filename } = body;
        return this.s3Service.generateDipPresignedUrl(filename);
    }

    @Post('getS3')
    @ApiOperation({ summary: 'RETORNA A OBJETOS DE UMA FOLDER DIP' })
    async getObjects(
        @Body() body: filePathDto
    ): Promise<any> {
        const { folderPath } = body;
        return this.s3Service.getFolderS3(folderPath);
    }

    @Post('package')
    @ApiOperation({ summary: 'REALIZA O TRANSFER PACKAGE' })
    @ApiBody({ type: archivematicaDto })
    async transfer(
        @Body() body: archivematicaDto,
    ): Promise<any> {
        return this.archService.transferPackage(body);
    }

}