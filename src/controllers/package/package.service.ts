/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Package } from './package.entity';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';

@Injectable()
export class PackageService {
    constructor(
        @Inject('PACKAGE_REPOSITORY') private packageRepository: Repository<Package>,
        @Inject(forwardRef(() => FileService)) private readonly fileService: FileService,
        @Inject(forwardRef(() => FolderService)) private readonly folderService: FolderService,
    ) { }

    async create(body: Package): Promise<Package> {
        body.id = uuidv4()
        body.folders = [];
        body.files = [];
        return await this.packageRepository.save(body);
    }

    async findAll(): Promise<Package[]> {
        return this.packageRepository.find();
    }

    async findOne(id: any): Promise<Package> {
        const verify = await this.packageRepository.findOne({ where: { id } });
        return verify;
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

        await this.packageRepository.update(id, body);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pacote não encontrado');
        }

        await this.recursiveDelete(verify);

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

}