/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransferBdService } from './transfer-bd.service';
@ApiTags('TRANSFER ARCHIVEMATICA')
@ApiBearerAuth()
@Controller('transfers')
export class TransferBdController {
    constructor(
        private readonly transferService: TransferBdService
    ) { }

    @Get()
    @ApiOperation({ summary: 'RETORNA TODAS TRASNFERÊNCIAS DO TRANSFER' })
    async transfers(): Promise<any[]> {
        return this.transferService.findAll();
    }

}