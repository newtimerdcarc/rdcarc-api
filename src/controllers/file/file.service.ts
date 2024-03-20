/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Raw, Repository } from 'typeorm';
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
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    ) { }

    getCurrentDate(): { year: number; month: number; day: number } {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        return { year, month, day };
    }

    convertToDateISO(dateObject: { year: number; month: number; day: number }): string {
        const { year, month, day } = dateObject;
        const monthString = month < 10 ? `0${month}` : `${month}`;
        const dayString = day < 10 ? `0${day}` : `${day}`;
        return `${year}-${monthString}-${dayString}`;
    }

    bytesToKB(bytes: number): string {
        if (bytes < 2 * 1024 * 1024) {
            // Convertendo para KB
            return (bytes / 1024).toFixed(2) + ' KB';
        } else if (bytes < 999 * 1024 * 1024) {
            // Convertendo para MB
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
            // Convertendo para GB
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        }
    }

    removeFilePrefix(mimeType: string): string {
        const parts = mimeType.split('/');
        return parts.length > 1 ? parts[1] : mimeType;
    }

    async basicCreate(file: File): Promise<any> {
        file.editable = false;
        return await this.fileRepository.save(file);
    }

    async create(file: Express.Multer.File, package_id: string, path: string, creator: string, insertTo: string): Promise<any> {
        const nameWithoutExtension = file.originalname.slice(0, file.originalname.lastIndexOf('.'));
        // Realiza o upload e retorna uma url
        const url = await this.s3Service.upload(file, path);

        const arquivo: File = {
            id: uuidv4(),
            editable: false,
            title: nameWithoutExtension,
            url,
            date: this.getCurrentDate(),
            size: this.bytesToKB(file.size),
            type: this.removeFilePrefix(file.mimetype),
            description: "",
            creator,
            package: package_id,
            subject: [""],
            contributor: "",
            coverage: "",
            format: "",
            identifier: "",
            language: "",
            publisher: "",
            relation: "",
            rights: "",
            source: "",
            // typeNew: ""
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

    async findByPackage(package_id: string): Promise<File[]> {
        return this.fileRepository.find({ where: { package: package_id } });
    }

    async findEditableByPackage(package_id: string): Promise<File[]> {
        return this.fileRepository.find({ where: { package: package_id, editable: true } });
    }

    async uploadMetadata(package_id): Promise<void> {
        const files = await this.findEditableByPackage(package_id);
        const metadata = [];

        const pacote = await this.packageService.findOne(package_id);
        const path = `${pacote.title}/metadata`

        if (files.length > 0) {
            for (const file of files) {
                const json = {
                    "filename": this.s3Service.removeS3UrlPrefix(file.url),
                    "dc.title": file.title,
                    "dc.creator": file.creator,
                    "dc.subject": file.subject,
                    "dc.description": file.description,
                    "dc.publisher": file.publisher,
                    "dc.contributor": file.contributor,
                    "dc.date": this.convertToDateISO(file.date),
                    "dc.type": file.type,
                    "dc.format": file.format,
                    "dc.identifier": file.identifier,
                    "dc.source": file.source,
                    "dc.language": file.language,
                    "dc.relation": file.relation,
                    "dc.coverage": file.coverage,
                    "dc.rights": file.rights
                }

                metadata.push(json);
            }
            await this.s3Service.uploadMetadataJsonToS3(metadata, path);
        }
    }

    async uploadXmls(package_id): Promise<void> {
        const files = await this.findByPackage(package_id);
        if (files.length > 0) {
            for (const xml of files) {
                await this.s3Service.uploadXmlToS3(xml);
            }
        }
    }

    async findConatainsPath(olderPath: string): Promise<File[]> {
        return await this.fileRepository.find({
            where: {
                url: Raw(alias => `${alias} LIKE '%amazonaws.com/${olderPath}%'`)
            }
        });
    }

    async findOne(id: any): Promise<File> {
        return await this.fileRepository.findOne({ where: { id } });
    }

    async update(id: string, body: any): Promise<File> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new HttpException('Arquivo nao encontrado', HttpStatus.BAD_REQUEST);
        }

        body.editable = true;

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
            await this.s3Service.deleteFileS3(verify.url)
        }
        else if (isPackage) {
            await this.packageService.removeFileFromPackage(insertTo, verify.id);
            await this.s3Service.deleteFileS3(verify.url)
        }
        else {
            throw new NotFoundException('O id passado não é válido como pasta ou pacote');
        }

        await this.fileRepository.delete(id);
    }

    async updatePath(id: any, olderFolder: string, newFolder: string): Promise<any> {
        const verify = await this.findOne(id);

        if (!verify) {
            throw new NotFoundException('Arquivo nao encontrado');
        }

        const url = verify.url.replace(olderFolder, newFolder);

        await this.fileRepository
            .createQueryBuilder()
            .update(File)
            .set({ url })
            .where("id = :id", { id })
            .execute();

        return await this.findOne(id);
    }

    // Utilizar para remover todas
    async deletar(id: string): Promise<void> {
        await this.fileRepository.delete(id);
    }

    async deletarTodos(): Promise<void> {
        await this.fileRepository.clear();
    }

}
