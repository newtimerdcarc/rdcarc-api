/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ArchivalService {
    constructor(
        @Inject('LOCATIONS_PACKAGE_REPOSITORY') private readonly locationsPackageRepository: any,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
    ) { }

    async findAll(): Promise<any[]> {
        const query = 'SELECT * FROM locations_package';
        return this.locationsPackageRepository.query(query);
    }

    // async findAllTransfers(): Promise<any[]> {
    //     const query = 'SELECT * FROM Transfers';
    //     return this.locationsPackageRepository.query(query);
    // }

    async findOne(uuid: string): Promise<any> {
        const archiveAip = await this.findByUUID(uuid);

        if (!archiveAip) {
            throw new NotFoundException('UUID inválido.');
        }

        archiveAip.title = this.getTitleFromCurrentFullPath(archiveAip);
        const dipName = this.removeAipExtension(archiveAip);
        const dip = await this.findDIPByName(dipName);

        if (!dip) {
            throw new NotFoundException('DIP nao encontrado.');
        }

        const files3 = await this.s3Service.getFolderS3(dip[0].current_path);

        const filterFiles = (keyword: string) => files3.filter(obj => obj.Key.includes(keyword));

        const objeto1 = { name: 'objects', files: filterFiles('objects') };
        const objeto2 = { name: 'OCRfiles', files: filterFiles('OCRfiles') };
        const objeto3 = { name: 'thumbnails', files: filterFiles('thumbnails') };

        const newFiles = [objeto1, objeto2, objeto3];

        archiveAip.DIP = {
            ...dip[0],
            files: newFiles,
            mets: filterFiles('METS')[0],
            pointer: filterFiles('processingMCP')[0],
        };

        return archiveAip;
    }

    async findByUUID(uuid: string): Promise<any | undefined> {
        const query = 'SELECT * FROM locations_package WHERE uuid = ? LIMIT 1';
        const result = await this.locationsPackageRepository.query(query, [uuid]);
        return result.length > 0 ? result[0] : undefined;
    }

    async findDIPByName(dipName: string): Promise<any[]> {
        const query = 'SELECT * FROM locations_package WHERE current_path LIKE ? AND package_type = ?';
        const parameters = [`%${dipName}%`, 'DIP'];
        return this.locationsPackageRepository.query(query, parameters);
    }

    private getTitleFromCurrentFullPath(pacote: any): string {
        const partes = pacote.current_path.split('/');
        const nomeFinal = partes[partes.length - 1];
        if (pacote.package_type === 'AIP') {
            const semUuid = nomeFinal.replace(`-${pacote.uuid}.7z`, ''); // Remove o uuid e a extensão .7z
            const partesSemUuid = semUuid.split('-');
            return partesSemUuid[0]; // Retorna a primeira parte após remover o uuid
        } else {
            return '';
        }
    }

    private removeAipExtension(pacote: any): string {
        const partes = pacote.current_path.split('/');
        const nomeFinal = partes[partes.length - 1];
        // Remover extensão .7z
        const semExtensao = nomeFinal.replace('.7z', '');
        // Remover prefixo com uuid
        const semUuid = semExtensao.split('-').slice(2).join('-');
        return semUuid;
    }

    async findAIPPackages(): Promise<any[]> {
        const query = 'SELECT * FROM locations_package WHERE package_type = "AIP" ORDER BY stored_date DESC';
        return this.locationsPackageRepository.query(query);
    }

    async findPackagesUploaded(): Promise<any[]> {
        const query = 'SELECT * FROM locations_package WHERE package_type = "AIP" AND status = "UPLOADED"';
        return this.locationsPackageRepository.query(query);
    }

    async findPackagesDeleted(): Promise<any[]> {
        const query = 'SELECT * FROM locations_package WHERE package_type = "AIP" AND status = "DELETED"';
        return this.locationsPackageRepository.query(query);
    }

    async findPackagesReqDel(): Promise<any[]> {
        const query = 'SELECT * FROM locations_package WHERE package_type = "AIP" AND status = "DEL_REQ"';
        return this.locationsPackageRepository.query(query);
    }
}
