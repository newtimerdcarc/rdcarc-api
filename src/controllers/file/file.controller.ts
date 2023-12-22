/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Put, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileDto, UpdateFileDto } from './file.dto';
import { File } from './file.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('ARQUIVO')
@ApiBearerAuth()
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @UseGuards(JwtAuthGuard)
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
        return this.fileService.create(file, body.path, body.creator, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'TODOS ARQUIVOS' })
    async findAll(): Promise<File[]> {
        return this.fileService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'BUSCAR ARQUIVO VIA ID' })
    async findOne(@Param('id') id: string): Promise<File> {
        return this.fileService.findOne(id);
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