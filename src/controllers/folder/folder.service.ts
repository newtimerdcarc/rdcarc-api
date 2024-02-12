/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Raw, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Folder } from './folder.entity';
import { PackageService } from '../package/package.service';
import { FileService } from '../file/file.service';
import { S3Service } from '../s3/s3.service';
@Injectable()
export class FolderService {
    constructor(
        @Inject('FOLDER_REPOSITORY') private folderRepository: Repository<Folder>,
        @Inject(forwardRef(() => PackageService)) private readonly packageService: PackageService,
        @Inject(forwardRef(() => FileService)) private readonly fileService: FileService,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
    ) { }

    getCurrentDate(): { year: number; month: number; day: number } {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        return { year, month, day };
    }

    async create(body: Folder): Promise<Folder> {
        body.id = uuidv4()
        body.folders = [];
        body.files = [];
        body.date = this.getCurrentDate();

        const newFolder = await this.folderRepository.save(body);

        if (body.origin === body.package) {
            await this.packageService.addFolderToPackage(body.origin, newFolder.id);
        }
        else {
            await this.addFolderToFolder(body.origin, newFolder.id);
        }

        return newFolder;
    }

    obterUltimoSegmento(caminho: string): string {
        const segmentos = caminho.split('/');
        return segmentos.pop();
    }

    async createFolderInPackage(body: any): Promise<any[]> {
        return await new Promise(async (resolve) => {
            const { titles, package: packageId, package_name } = body;
            const createdFolders: any = [];

            const createFolderRecursive = async (titles: string[], parentId?: string) => {
                if (titles.length === 0) {
                    return;
                }

                const anterior = await this.findOne(parentId);
                const title = titles.shift(); // Remove e retorna o primeiro elemento do array
                const folder = new Folder();
                folder.title = this.obterUltimoSegmento(title);
                folder.package = packageId;
                folder.origin = anterior.id;
                folder.path = `${anterior.path}/${anterior.title}`;
                folder.date = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
                folder.folders = [];
                folder.files = [];

                const newFolder = await this.folderRepository.save(folder);
                createdFolders.push(newFolder);
                // Se ainda houver títulos, chama recursivamente
                if (titles.length > 0) {
                    await createFolderRecursive(titles, newFolder.id); // Corrigido: Passa o ID da nova pasta como parentId
                }
            };

            // Cria a primeira pasta
            const firstTitle = titles.shift(); // Remove e retorna o primeiro elemento do array
            const firstFolder = new Folder();
            firstFolder.title = firstTitle;
            firstFolder.package = packageId;
            firstFolder.origin = packageId; // A origem da primeira pasta é o próprio pacote
            firstFolder.path = `${package_name}`;
            firstFolder.date = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
            firstFolder.folders = [];
            firstFolder.files = [];
            const firstNewFolder = await this.folderRepository.save(firstFolder);
            createdFolders.push(firstNewFolder);

            // Chama a função recursiva para criar as pastas restantes
            await createFolderRecursive([...titles], firstNewFolder.id);

            const response = await this.beforeCreating(createdFolders);

            resolve(response);
        });
    }

    async beforeCreating(folders: Folder[]): Promise<any> {
        if (folders.length > 0) {
            const ids = folders.map(folder => folder.id);
            const raiz = folders[0];
            await this.packageService.addFolderToPackage(raiz.package, raiz.id);
            folders.shift();

            for (const folder of folders) {
                await this.addFolderToFolder(folder.origin, folder.id);
            }

            return await this.findIds(ids);
        }
        else {
            throw new NotFoundException('Pastas não repassadas');
        }
    }

    async findIds(ids: string[]): Promise<any[]> {
        const result = [];
        for (const folder of ids) {
            const aux = await this.findOne(folder);
            result.push(aux);
        }
        return result;
    }

    async findAll(): Promise<Folder[]> {
        return this.folderRepository.find();
    }

    async findOne(id: any): Promise<Folder> {
        return await this.folderRepository.findOne({ where: { id } });
    }

    async findContainsPath(olderPath: string): Promise<Folder[]> {
        return await this.folderRepository.find({
            where: {
                path: Raw(alias => `${alias} LIKE '%${olderPath}%'`)
            }
        });
    }

    async findDetails(id: any): Promise<any> {
        const verify: any = await this.folderRepository.findOne({ where: { id } });

        if (verify) {
            const folderDetailsPromises = verify.folders.map(async (folderId: string) => {
                const folderDetails = await this.findOne(folderId);
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

    // Auxiliares para details
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

    async addFolderToFolder(id: string, folderValue: string): Promise<Folder> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta não encontrada');
        }

        // Recuperar o array atual de pastas
        const currentFolders = folderEntity.folders || [];

        // Adicionar a nova pasta ao array
        currentFolders.push(folderValue);

        // Atualizar o array no banco de dados
        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ folders: currentFolders })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async addFileToFolder(id: string, fileValue: string): Promise<Folder> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta não encontrada');
        }

        // Recuperar o array atual
        const currentFiles = folderEntity.files || [];

        // Adicionar o novo arquivo ao array
        currentFiles.push(fileValue);

        // Atualizar o array no banco de dados
        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ files: currentFiles })
            .where('id = :id', { id })
            .execute();

        return this.findOne(id);
    }

    async removeFolderFromFolder(id: string, folderValue: string): Promise<void> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta não encontrada');
        }

        // Garantir que o array de pastas esteja inicializado
        const currentFolders = folderEntity.folders || [];

        // Encontrar o índice da pasta a ser removida
        const folderIndex = currentFolders.indexOf(folderValue);

        if (folderIndex !== -1) {
            // Remover a pasta do array
            currentFolders.splice(folderIndex, 1);

            // Atualizar o array no banco de dados
            await this.folderRepository
                .createQueryBuilder()
                .update(Folder)
                .set({ folders: currentFolders })
                .where('id = :id', { id })
                .execute();
        } else {
            throw new NotFoundException('Pasta não encontrada no array');
        }
    }

    async removeFileFromFolder(id: string, fileValue: string): Promise<void> {
        const folderEntity = await this.findOne(id);

        if (!folderEntity) {
            throw new NotFoundException('Pasta não encontrada');
        }

        // Garantir que o array de arquivos esteja inicializado
        const currentFiles = folderEntity.files || [];

        // Encontrar o índice do arquivo a ser removido
        const fileIndex = currentFiles.indexOf(fileValue);

        if (fileIndex !== -1) {
            // Remover o arquivo do array
            currentFiles.splice(fileIndex, 1);

            // Atualizar o array no banco de dados
            await this.folderRepository
                .createQueryBuilder()
                .update(Folder)
                .set({ files: currentFiles })
                .where('id = :id', { id })
                .execute();
        } else {
            throw new NotFoundException('Arquivo não encontrado no array');
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

    async updatePath(id: any, olderFolder: string, newFolder: string): Promise<any> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pasta nao encontrada');
        }

        const path = verify.path.replace(olderFolder, newFolder);

        await this.folderRepository
            .createQueryBuilder()
            .update(Folder)
            .set({ path })
            .where("id = :id", { id })
            .execute();

        return await this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Pasta não encontrada');
        }

        if (verify.folders.length > 0 || verify.files.length > 0) {
            await this.s3Service.deleteFolderNoPackageS3(`${verify.path}/${verify.title}`);
        }
        await this.folderRepository.delete(id);
    }

    async deletar(id: string): Promise<void> {
        const deleted = await this.findOne(id);

        if (!deleted) {
            return;
        }

        if (deleted.folders.length > 0 || deleted.files.length > 0) {
            // Crie um array de promises para deletar os arquivos associados
            const deleteFilePromises = deleted.files.map(fileValue =>
                this.fileService.deletar(fileValue)
            );

            // Aguarde a resolução de todas as promises de exclusão de arquivos
            await Promise.all(deleteFilePromises);

            // Crie um array de promises para deletar as pastas associadas
            const deleteFolderPromises = deleted.folders.map(folderValue =>
                this.deletar(folderValue)
            );

            // Aguarde a resolução de todas as promises de exclusão de pastas
            await Promise.all(deleteFolderPromises);

            // Deleta a pasta no s3
            await this.s3Service.deleteFolderNoPackageS3(`${deleted.path}/${deleted.title}`);
        }

        // Aguarde a exclusão da pasta principal
        await this.folderRepository.delete(id);
    }

}