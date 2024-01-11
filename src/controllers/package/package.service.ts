/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Package } from './package.entity';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { S3Service } from '../s3/s3.service';
@Injectable()
export class PackageService {
    constructor(
        @Inject('PACKAGE_REPOSITORY') private packageRepository: Repository<Package>,
        @Inject(forwardRef(() => FileService)) private readonly fileService: FileService,
        @Inject(forwardRef(() => FolderService)) private readonly folderService: FolderService,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
    ) { }

    async create(body: Package): Promise<Package> {
        const exist = await this.findByName(body.title);

        if (exist) {
            throw new HttpException('Já existe um pacote com esse nome!', HttpStatus.BAD_REQUEST);
        }

        body.id = uuidv4()
        body.folders = [];
        body.files = [];
        return await this.packageRepository.save(body);
    }

    async findAll(): Promise<Package[]> {
        return this.packageRepository.find();
    }

    async findOne(id: any): Promise<Package> {
        return await this.packageRepository.findOne({ where: { id } });
    }

    async findByName(title: string): Promise<Package> {
        return await this.packageRepository.findOne({ where: { title } });
    }

    async findDetails(id: any): Promise<any> {
        const verify: any = await this.packageRepository.findOne({ where: { id } });

        if (verify) {
            const folderDetailsPromises = verify.folders.map(async (folderId: string) => {
                const folderDetails = await this.folderService.findOne(folderId);
                return folderDetails !== null ? folderDetails : undefined;
            });

            const fileDetailsPromises = verify.files.map(async (fileId: string) => {
                const fileDetails = await this.fileService.findOne(fileId);
                return fileDetails !== null ? fileDetails : undefined;
            });

            // Aguarde todas as promessas e obtenha os detalhes das pastas e arquivos
            verify.folders = (await Promise.all(folderDetailsPromises)).filter(Boolean);
            verify.files = (await Promise.all(fileDetailsPromises)).filter(Boolean);
        }

        return verify;
    }

    convertISOStringToDateDetails(isoString: string): { year: number; month: number; day: number } {
        const date = new Date(isoString);

        return {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
        };
    }

    getFileExtension(key: string): string | null {
        const match = key.match(/\.([^.]+)$/);

        return match ? match[1].toLowerCase() : null;
    }

    async addFolderToPackage(id: string, folderValue: string): Promise<Package> {
        const packageEntity = await this.findOne(id);

        if (!packageEntity) {
            throw new NotFoundException('Pacote nao encontrado');
        }

        // Adicionar a nova pasta ao array
        await this.packageRepository
            .createQueryBuilder()
            .update(Package)
            .set({ folders: () => `JSON_ARRAY_APPEND(folders, '$', '${folderValue}')` })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async addFileToPackage(id: string, fileValue: string): Promise<Package> {
        const packageEntity = await this.findOne(id);

        if (!packageEntity) {
            throw new NotFoundException('Pacote nao encontrado');
        }

        // Adicionar a nova pasta ao array
        await this.packageRepository
            .createQueryBuilder()
            .update(Package)
            .set({
                quantity: () => 'quantity + 1', // Incrementa quantity em 1
                files: () => `JSON_ARRAY_APPEND(files, '$', '${fileValue}')`,
            })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async removeFileFromPackage(id: string, fileValue: string): Promise<void> {
        const result = await this.packageRepository
            .createQueryBuilder()
            .update(Package)
            .set({
                quantity: () => 'GREATEST(quantity - 1, 0)', // Subtrai 1 de quantity, mas não deixa ficar negativo
                files: () => `JSON_REMOVE(files, JSON_UNQUOTE(JSON_SEARCH(files, 'one', '${fileValue}')))`,
            })
            .where('id = :id', { id })
            .execute();

        if (result.affected === 0) {
            throw new NotFoundException('Pacote não encontrado');
        }
    }

    async removeFolderFromPackage(id: string, folderValue: string): Promise<void> {
        const files = await this.folderService.findOne(folderValue);
        const result = await this.packageRepository
            .createQueryBuilder()
            .update(Package)
            .set({
                folders: () => `JSON_REMOVE(folders, JSON_UNQUOTE(JSON_SEARCH(folders, 'one', '${folderValue}')))`,
            })
            .where('id = :id', { id })
            .execute();

        //Irá deletar todos os arquivos da pasta apagada
        if (files.files.length > 0) {
            for (const fileValue of files.files) {
                await this.fileService.deletar(fileValue);
            }
        }

        if (result.affected === 0) {
            throw new NotFoundException('Pasta não encontrada');
        }
    }

    async update(id: string, body: any): Promise<Package> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pacote nao encontrado');
        }

        const existName = await this.findByName(body.title);

        if (existName) {
            throw new HttpException('Já existe um pacote com esse nome!', HttpStatus.BAD_REQUEST);
        }

        await this.packageRepository.update(id, body);

        // Está alterando o título
        if (body.title !== verify.title) {
            // Alterando o nome no S3
            const s3Rename = await this.s3Service.renameFolderS3(verify.title, body.title);

            if (s3Rename) {
                // Obtendo as pastas que contem o Path
                const folders = await this.folderService.findContainsPath(verify.title);
                // Alterando as pastas
                for (const folder of folders) {
                    await this.folderService.updatePath(folder.id, verify.title, body.title);
                }
                // Obtem todos os arquivos com o path antigo
                const allFiles = await this.fileService.findConatainsPath(verify.title);
                // Alterando as urls pela nova
                for (const file of allFiles) {
                    await this.fileService.updatePath(file.id, verify.title, body.title);
                }
            }
        }

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pacote não encontrado');
        }

        await this.recursiveDelete(verify);
        await this.s3Service.deleteFolderS3(verify.title);

        await this.packageRepository.delete(id);
    }

    private async recursiveDelete(packageEntity: Package): Promise<void> {
        if (packageEntity.folders.length > 0) {
            for (const folderValue of packageEntity.folders) {
                await this.folderService.deletar(folderValue);
            }
        }

        if (packageEntity.files.length > 0) {
            for (const fileValue of packageEntity.files) {
                await this.fileService.deletar(fileValue);
            }
        }
    }

    async deletePackage(title: string): Promise<void> {
        const pacote = await this.findByName(title);
        await this.recursiveDelete(pacote);
        await this.packageRepository.delete(pacote.id);
    }

}