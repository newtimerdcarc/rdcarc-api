/* eslint-disable prettier/prettier */
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transfer } from './transfer.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ArchivematicaService {

    constructor(
        @Inject('TRANSFER_REPOSITORY') private transferRepository: Repository<Transfer>,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
    ) { }

    public apiUrl = process.env.API_STORAGE;
    public apiKey = process.env.ARCHIVEMATICA_KEY;
    public path = process.env.ARCHIVEMATICA_UUID_PATH;
    public host = process.env.ARCHIVEMATICA_HOST;

    async create(body: any): Promise<any> {
        return await this.transferRepository.save(body);
    }

    async findAll(): Promise<any[]> {
        return this.transferRepository.find();
    }

    async transferPackage(body: any): Promise<any> {
        const headers = {
            Authorization: `ApiKey ${body.username}:${this.apiKey}`,
            'Content-Type': 'application/json',
        };

        body.name = body.folder;
        body.access_system_id = '';
        body.accession = '';
        body.auto_approve = true;
        body.metadata_set_id = '';
        body.processing_config = 'default';
        body.type = 'standard';
        const newPath = `${this.path}/${body.folder}`;
        const pathBase64 = Buffer.from(newPath).toString('base64');
        body.path = pathBase64;

        try {
            const response = await axios.post(`${this.apiUrl}/v2beta/package`, body, { headers });
            const id = response.data.id;

            // Introduzindo um atraso de 1,5 segundos
            await new Promise(resolve => setTimeout(resolve, 1500));
            const res = await this.transferStatus(body.username, id);
            res.user = body.username;
            await this.create(res);
            await this.s3Service.deleteFolderS3(body.folder);
            return res;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }

    async transferStatus(username: string, uuid: string): Promise<any> {
        const headers = {
            Authorization: `ApiKey ${username}:${this.apiKey}`,
            Host: this.host
        };

        try {
            const response = await axios.get(`${this.apiUrl}/transfer/status/${uuid}`, { headers });
            return response.data;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }
}
