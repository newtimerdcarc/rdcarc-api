/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Folder } from './folder.entity';
import { FolderDto, UpdateTitleDto, UploadFolderPackageDto } from './folder.dto';
import { FolderService } from './folder.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('PASTA')
@ApiBearerAuth()
@Controller('folder')
export class FolderController {
    constructor(private readonly folderService: FolderService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'CRIAR PASTA' })
    @ApiBody({ type: FolderDto })
    async create(
        @Body() body: Folder,
    ): Promise<Folder> {
        return await this.folderService.create(body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('package')
    @ApiOperation({ summary: 'CRIAR PASTAS ATRAVÉS DO UPLOAD DE ARQUIVOS DENTRO DE UM PACOTE' })
    @ApiBody({ type: UploadFolderPackageDto })
    async createFolderInPackage(
        @Body() body: UploadFolderPackageDto,
    ): Promise<any[]> {
        return await this.folderService.createFolderInPackage(body);
    }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'TODOS PASTAS' })
    async findAll(): Promise<Folder[]> {
        return await this.folderService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'BUSCAR PASTA VIA ID' })
    async findOne(@Param('id') id: string): Promise<Folder> {
        return await this.folderService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/details')
    @ApiOperation({ summary: 'BUSCAR PASTA VIA ID, TRAZENDO SEUS CAMPOS' })
    async findDetails(@Param('id') id: string): Promise<any> {
        return await this.folderService.findDetails(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/title')
    @ApiOperation({ summary: 'ATUALIZAR TÍTULO DA PASTA' })
    @ApiBody({ type: UpdateTitleDto })
    async updateTitle(@Param('id') id: string, @Body('title') title: string): Promise<any> {
        return await this.folderService.updateTitle(id, title);
    }

    // @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'DELETAR PASTA' })
    async remove(@Param('id') id: string): Promise<void> {
        return await this.folderService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/all')
    @ApiOperation({ summary: 'DELETAR PASTA' })
    async deletar(@Param('id') id: string): Promise<void> {
        return await this.folderService.deletar(id);
    }

}