/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Folder } from './folder.entity';
import { PackageService } from '../package/package.service';
import { FileService } from '../file/file.service';

@Injectable()
export class FolderService {
    constructor(
        @Inject('FOLDER_REPOSITORY') private folderRepository: Repository<Folder>,
        @Inject(forwardRef(() => PackageService)) private readonly packageService: PackageService,
        @Inject(forwardRef(() => FileService)) private readonly fileService: FileService,
    ) { }

    async create(body: Folder): Promise<Folder> {
        body.id = uuidv4()
        body.folders = [];
        body.files = [];

        const newFolder = await this.folderRepository.save(body);

        if (body.origin === body.package) {
            await this.packageService.addFolderToPackage(body.origin, newFolder.id);
        }
        else {
            await this.addFolderToFolder(body.origin, newFolder.id);
        }

        return newFolder;
    }

    async findAll(): Promise<Folder[]> {
        return this.folderRepository.find();
    }

    async findOne(id: any): Promise<Folder> {
        const verify = await this.folderRepository.findOne({ where: { id } });
        return verify;
    }

    async addFolderToFolder(id: string, folderValue: string): Promise<Folder> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta nao encontrada');
        }

        // Adicionar a nova pasta ao array
        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ folders: () => `JSON_ARRAY_APPEND(folders, '$', '${folderValue}')` })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async addFileToFolder(id: string, fileValue: string): Promise<Folder> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta nao encontrada');
        }

        // Adicionar a nova pasta ao array
        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ files: () => `JSON_ARRAY_APPEND(folders, '$', '${fileValue}')` })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async removeFolderFromFolder(id: string, folderValue: string): Promise<void> {
        const files = await this.findOne(folderValue);
        const result = await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
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

    async removeFileFromFolder(id: string, fileValue: string): Promise<void> {
        const result = await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({
                files: () => `JSON_REMOVE(files, JSON_UNQUOTE(JSON_SEARCH(files, 'one', '${fileValue}')))`,
            })
            .where('id = :id', { id })
            .execute();

        if (result.affected === 0) {
            throw new NotFoundException('Pasta não encontrada');
        }
    }

    async updateTitle(id: any, newTitle: string): Promise<any> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pasta nao encontrada');
        }

        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ title: newTitle })
            .where("id = :id", { id })
            .execute();

        return await this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pasta não encontrada');
        }

        await this.folderRepository.delete(id);
    }

    async deletar(id: string): Promise<void> {
        const deleted = await this.findOne(id);

        if (!deleted) {
            return;
        }

        if (deleted.files.length > 0) {
            for (const fileValue of deleted.files) {
                await this.fileService.deletar(fileValue);
            }
        }

        if (deleted.folders.length > 0) {
            for (const folderValue of deleted.folders) {
                await this.deletar(folderValue);
            }
        }

        await this.folderRepository.delete(id);
    }

}