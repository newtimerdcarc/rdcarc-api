/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TransferBdController } from './transfer-bd.controller';
import { TransferBdService } from './transfer-bd.service';
import { TransferBdProvider } from './transfer-bd.provider';
@Module({
    imports: [
        DatabaseModule,
    ],
    controllers: [TransferBdController],
    providers: [TransferBdService, TransferBdProvider],
    exports: [TransferBdService]
})
export class TransferBdModule {}