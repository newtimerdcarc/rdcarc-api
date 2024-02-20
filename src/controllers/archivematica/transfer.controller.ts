/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
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

    @Get(':uuid/download')
    @ApiOperation({ summary: 'DOWNLOAD DO ARQUIVO AIP' })
    async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
        try {
            const fileStream = await this.archService.zipAipDownload(uuid);
            Object.keys(fileStream.headers).forEach(key => {
                res.setHeader(key, fileStream.headers[key]);
            });

            fileStream.pipe(res);

        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erro ao baixar o arquivo.');
        }
    }

    @Get(':user/packages')
    @ApiOperation({ summary: 'BUSCAR TODOS OS PACOTES NO ARCHIVEMATICA' })
    async getAllPackages(): Promise<any> {
        return this.archService.getAllPackages();
    }

    @Get(':id/details')
    @ApiOperation({ summary: 'BUSCAR UM PACOTE ESPECÍFICO' })
    async getFileDetails(
        @Param('id') id: string
    ): Promise<any> {
        return this.archService.getFileDetails(id);
    }

    @Post()
    @ApiOperation({ summary: 'CRIA A TRANSFER NO BANCO' })
    @ApiBody({ type: Transfer })
    async regisTransfer(
        @Body() body: any,
    ): Promise<any> {
        return this.archService.create(body);
    }

    @Post('download')
    @ApiOperation({ summary: 'RETORNA A URL PARA DOWNLOAD DE UM ARQUIVO DO S3' })
    async download(
        @Body() body: filenameUrlDto
    ): Promise<any> {
        const { filename } = body;
        return this.s3Service.generateUrl(filename);
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