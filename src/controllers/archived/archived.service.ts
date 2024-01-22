/* eslint-disable prettier/prettier */
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Raw, Repository } from 'typeorm';
import { S3Service } from '../s3/s3.service';
import { Archived } from './archived.entity';
import { ArchivematicaService } from '../archivematica/archivematica.service';
@Injectable()
export class ArchivedService {

    constructor(
        @Inject('ARCHIVED_REPOSITORY') private archivedRepository: Repository<Archived>,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
        @Inject(forwardRef(() => ArchivematicaService)) private readonly maticaService: ArchivematicaService,
    ) { }

    async basicFindAll(): Promise<any[]> {
        return await this.archivedRepository.find();
    }

    async findOne(uuid: any): Promise<any> {
        const file: any = await this.archivedRepository.findOne({ where: { uuid } });
        const dipName = this.removeAipExtension(file);
        const dip = await this.archivedRepository.find({
            where: {
                current_path: Raw(alias => `${alias} LIKE '%${dipName}%'`),
                package_type: "DIP"
            }
        });

        if (dip) {
            const files3 = await this.s3Service.getFolderS3(dip[0].current_path);
            // Filtro para objetos contendo "METS" na Key
            const mets = files3.filter(obj => obj.Key.includes("METS"));
            // Filtro para objetos contendo "processingMCP" na Key
            const pointer = files3.filter(obj => obj.Key.includes("processingMCP"));

            file.DIP = dip[0];
            file.DIP.files = files3;
            file.DIP.mets = mets[0];
            file.DIP.pointer = pointer[0];
        }

        return file;
    }

    async findUpdate(): Promise<any[]> {
        const packages = await this.maticaService.getAllPackages();
        const arquivados = await this.archivedRepository.find();

        const pacotesNaoArquivados = packages.filter(pacote =>
            !arquivados.some(arquivado => arquivado.uuid === pacote.uuid),
        );

        for (const pacote of pacotesNaoArquivados) {
            pacote.title = this.getTitleFromCurrentFullPath(pacote);
            await this.archivedRepository.save(pacote);
        }

        return await this.archivedRepository.find({
            where: {
                package_type: "AIP"
            },
            order: {
                title: 'ASC'
            },
        });
    }

    private getTitleFromCurrentFullPath(pacote: any): string {
        const partes = pacote.current_full_path.split('/');
        const nomeFinal = partes[partes.length - 1];

        if (pacote.package_type === 'DIP') {
            // return nomeFinal.replace(`-${pacote.uuid}`, ''); // Remove o uuid do final
            return nomeFinal;
        } else if (pacote.package_type === 'AIP') {
            const semUuid = nomeFinal.replace(`-${pacote.uuid}.7z`, ''); // Remove o uuid e a extensão .7z
            const partesSemUuid = semUuid.split('-');
            return partesSemUuid[0]; // Retorna a primeira parte após remover o uuid
        } else {
            return '';
        }
    }

    private removeAipExtension(pacote: any): string {
        const partes = pacote.current_full_path.split('/');
        const nomeFinal = partes[partes.length - 1];

        // Remover extensão .7z
        const semExtensao = nomeFinal.replace('.7z', '');

        // Remover prefixo com uuid
        const semUuid = semExtensao.split('-').slice(2).join('-');

        return semUuid;
    }


}