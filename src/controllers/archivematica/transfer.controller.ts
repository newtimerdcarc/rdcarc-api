/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { archivematicaDto } from '../archivematica/archivematica.dto';
import { ArchivematicaService } from '../archivematica/archivematica.service';
@ApiTags('ARCHIVEMATICA')
@Controller('transfer')
export class TransferController {
    constructor( private readonly archService: ArchivematicaService) { }

    @Get()
    @ApiOperation({ summary: 'TODOS TRANSFERS REALIZADOS' })
    async findAll(): Promise<any[]> {
        return this.archService.findAll();
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