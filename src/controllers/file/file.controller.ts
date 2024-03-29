/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Put, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileDto, UpdateFileDto } from './file.dto';
import { File } from './file.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { S3Service } from '../s3/s3.service';
@ApiTags('ARQUIVO')
@ApiBearerAuth()
@Controller('file')
export class FileController {
    constructor(
        private readonly fileService: FileService,
        private readonly s3Service: S3Service
    ) { }

    @Post(':id')
    @ApiBody({ type: FileDto })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'SUBIR ARQUIVO' })
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Param('id') id: string,
        @Body() body: FileDto,
    ): Promise<any> {
        return this.fileService.create(file, body.package, body.path, body.creator, id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':package_id/xml')
    @ApiOperation({ summary: 'CRIAÇÃO DE ARQUIVOS XML NO S3' })
    async uploadXmls(@Param('package_id') package_id: string): Promise<void> {
        this.fileService.uploadXmls(package_id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':package_id/metadata')
    @ApiOperation({ summary: 'CRIAÇÃO DA PASTA METADATA NO S3' })
    async uploadMetadata(@Param('package_id') package_id: string): Promise<void> {
        this.fileService.uploadMetadata(package_id);
    }

    // @UseGuards(JwtAuthGuard)
    // @Get()
    // @ApiOperation({ summary: 'TODOS ARQUIVOS' })
    // async findAll(): Promise<File[]> {
    //     return this.fileService.findAll();
    // }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'BUSCAR ARQUIVO VIA ID' })
    async findOne(@Param('id') id: string): Promise<File> {
        return this.fileService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':package_id/package')
    @ApiOperation({ summary: 'BUSCAR ARQUIVOS VIA PACKAGE ID' })
    async findByPackage(@Param('package_id') package_id: string): Promise<File[]> {
        return this.fileService.findByPackage(package_id);
    }

    @Get(':path/s3')
    @ApiOperation({ summary: 'TODOS ARQUIVOS NO BUCKET S3' })
    async findS3Objects(@Param('path') path: string): Promise<any[]> {
        return this.s3Service.getAllObjectsInBucket(path);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    @ApiOperation({ summary: 'EDITAR ARQUIVO' })
    @ApiBody({ type: UpdateFileDto })
    async update(
        @Param('id') id: string,
        @Body() body: UpdateFileDto,
    ): Promise<any> {
        return this.fileService.update(id, body);
    }

    @Delete()
    @ApiOperation({ summary: 'DELETAR TODOS OS ARQUIVOS DO BANCO DE DADOS' })
    async deletarTodos(): Promise<void> {
        this.fileService.deletarTodos();
    }

    @Delete('aws/:path')
    @ApiOperation({ summary: 'DELETAR PASTA AWS' })
    async deleteFolderS3(
        @Param('path') path: string,
    ): Promise<void> {
        this.s3Service.deleteFolderS3(path);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'DELETAR ARQUIVO APENAS DO BANCO' })
    async removeOne(
        @Param('id') id: string,
    ): Promise<void> {
        return this.fileService.deletar(id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/:path')
    @ApiOperation({ summary: 'DELETAR ARQUIVO' })
    async remove(
        @Param('id') id: string,
        @Param('path') path: string,
    ): Promise<void> {
        return this.fileService.remove(id, path);
    }

}