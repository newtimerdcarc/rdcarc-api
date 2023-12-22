/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Package } from './package.entity';
import { PackageDto } from './package.dto';
import { PackageService } from './package.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('PACOTE')
@ApiBearerAuth()
@Controller('package')
export class PackageController {
    constructor(private readonly packageService: PackageService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'CRIAR PACOTE' })
    @ApiBody({ type: PackageDto })
    async create(
        @Body() body: Package,
    ): Promise<Package> {
        return this.packageService.create(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'TODOS PACOTES' })
    async findAll(): Promise<Package[]> {
        return this.packageService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'BUSCAR PACOTE VIA ID' })
    async findOne(@Param('id') id: string): Promise<Package> {
        return this.packageService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    @ApiOperation({ summary: 'EDITAR PACOTE' })
    @ApiBody({ type: PackageDto })
    async update(
        @Param('id') id: string,
        @Body() body: any,
    ): Promise<Package> {
        return this.packageService.update(id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'DELETAR PACOTE' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.packageService.remove(id);
    }

}