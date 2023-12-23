/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { File } from './file.entity';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../s3/s3.service';
import { FolderService } from '../folder/folder.service';
import { PackageService } from '../package/package.service';
import { UserService } from '../user/user.service';

@Injectable()
export class FileService {
    constructor(
        @Inject('FILE_REPOSITORY') private readonly fileRepository: Repository<File>,
        @Inject(forwardRef(() => FolderService)) private readonly folderService: FolderService,
        @Inject(forwardRef(() => PackageService)) private readonly packageService: PackageService,
        private readonly userService: UserService,
        private readonly s3Service: S3Service,
    ) { }

    getCurrentDate(): { year: number; month: number; day: number } {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        return { year, month, day };
    }

    bytesToKB(bytes: number): string {
        return (bytes / 1024).toFixed(2) + ' KB';
    }

    removeFilePrefix(mimeType: string): string {
        const parts = mimeType.split('/');
        return parts.length > 1 ? parts[1] : mimeType;
    }

    async create(file: Express.Multer.File, path: string, creator: string, insertTo: string): Promise<any> {
        const nameWithoutExtension = file.originalname.slice(0, file.originalname.lastIndexOf('.'));
        // Realiza o upload e retorna uma url
        const url = ""
        // const url = await this.s3Service.upload(file, path);

        const arquivo: File = {
            id: uuidv4(),
            title: nameWithoutExtension,
            url,
            date: this.getCurrentDate(),
            size: this.bytesToKB(file.size),
            type: this.removeFilePrefix(file.mimetype),
            description: "",
            creator,
            resolution: "",
            contributor: "",
            coverage: "",
            format: "",
            identifier: "",
            language: "",
            publisher: "",
            relation: "",
            rights: "",
            source: "",
            typeNew: ""
        };

        // Cria o arquivo
        const newFile = await this.fileRepository.save(arquivo);
        // Verifica id passado como parametro
        const isFolder = await this.folderService.findOne(insertTo);
        const isPackage = await this.packageService.findOne(insertTo);

        if (isFolder) {
            await this.folderService.addFileToFolder(insertTo, newFile.id);
        }
        else if (isPackage) {
            await this.packageService.addFileToPackage(insertTo, newFile.id);
        }
        else {
            throw new NotFoundException('O id passado não é válido como pasta ou pacote')
        }

        return newFile;
    }

    async findAll(): Promise<File[]> {
        return this.fileRepository.find();
    }

    async findOne(id: any): Promise<File> {
        const verify = await this.fileRepository.findOne({ where: { id } });

        // if (!verify) {
        //     throw new HttpException('Arquivo nao encontrado', HttpStatus.BAD_REQUEST);
        // }

        return verify;
    }

    async update(id: string, body: any): Promise<File> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new HttpException('Arquivo nao encontrado', HttpStatus.BAD_REQUEST);
        }

        await this.fileRepository.update(id, body);
        return this.findOne(id);
    }

    async remove(id: string, insertTo: string): Promise<void> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new HttpException('Arquivo não encontrado', HttpStatus.BAD_REQUEST);
        }

        // Verifica id passado como parametro
        const isFolder = await this.folderService.findOne(insertTo);
        const isPackage = await this.packageService.findOne(insertTo);

        if (isFolder) {
            await this.folderService.removeFileFromFolder(insertTo, verify.id);
        }
        else if (isPackage) {
            await this.packageService.removeFileFromPackage(insertTo, verify.id);
        }
        else {
            throw new NotFoundException('O id passado não é válido como pasta ou pacote');
        }

        await this.fileRepository.delete(id);
    }

    // Utilizar para remover todas
    async deletar(id: string): Promise<void> {
        await this.fileRepository.delete(id);
    }

}
