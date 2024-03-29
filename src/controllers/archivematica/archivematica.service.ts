/* eslint-disable prettier/prettier */
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transfer } from './transfer.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { S3Service } from '../s3/s3.service';
import { ArchivedService } from '../archived/archived.service';

@Injectable()
export class ArchivematicaService {

    constructor(
        @Inject('TRANSFER_REPOSITORY') private transferRepository: Repository<Transfer>,
        @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
        @Inject(forwardRef(() => ArchivedService)) private readonly archService: ArchivedService,
    ) { }

    public apiUrl = process.env.API_STORAGE;
    public apiKey = process.env.ARCHIVEMATICA_KEY;
    public apiKey8000 = process.env.ARCHIVEMATICA_KEY_8000;
    public path = process.env.ARCHIVEMATICA_UUID_PATH;
    public host = process.env.ARCHIVEMATICA_HOST;
    public pipeline = process.env.ARCHIVEMATICA_PIPELINE;

    async create(body: any): Promise<any> {
        return await this.transferRepository.save(body);
    }

    async findAll(): Promise<any[]> {
        return this.transferRepository.find();
    }

    async deleteAll(): Promise<void> {
        await this.transferRepository.clear();
    }

    async zipAipDownload(uuid: string) {
        try {
            const url = `http://${this.host}:8000/api/v2/file/${uuid}/download`;
            const headers = {
                Authorization: `ApiKey admin:${this.apiKey8000}`
            };
            const response = await axios.get(url, { headers, responseType: 'stream' });
            return response.data;
        } catch (error) {
            throw new Error('Erro ao baixar o arquivo.');
        }
    }

    async transferPackage(body: any): Promise<any> {
        const headers = {
            Authorization: `ApiKey ${body.username}:${body.apiKey}`,
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
            const res = { uuid: id };
            await new Promise(resolve => setTimeout(resolve, 3000));

            await this.s3Service.deleteFolderS3(body.folder);

            return res;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }

    async transferStatus(username: string, key: string, uuid: string): Promise<any> {
        const headers = {
            Authorization: `ApiKey ${username}:${key}`,
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

    async getAllPackages(): Promise<any> {
        const headers = {
            Authorization: `ApiKey admin:${this.apiKey8000}`,
        };
        let allPackages = [];

        try {
            let response = await this.getPackagesWithOffset(headers, 0);
            allPackages = allPackages.concat(response.objects);

            while (response.meta.next) {
                const nextOffset = new URL(response.meta.next).searchParams.get('offset');
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = await this.getPackagesWithOffset(headers, parseInt(nextOffset, 10));
                allPackages = allPackages.concat(response.objects);
            }

            return allPackages;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }

    private async getPackagesWithOffset(headers: any, offset: number): Promise<any> {
        const params = { limit: 0, offset };
        const response = await axios.get(`http://${this.host}:8000/api/v2/file/`, { headers, params });
        return response.data;
    }

    async getFileDetails(uuid: string): Promise<any> {
        const headers = {
            Authorization: `ApiKey admin:${this.apiKey8000}`,
        };

        try {
            const response = await axios.get(`http://${this.host}:8000/api/v2/file/${uuid}`, { headers });
            return response.data;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }

    async deletePakcage(body: any): Promise<any> {
        const headers = {
            Authorization: `ApiKey ${body.username}:${body.storage_key}`,
            'Content-Type': 'application/json'
        };

        const deleteBody = {
            event_reason: body.event_reason,
            pipeline: this.pipeline,
            user_id: 1,
            user_email: body.user_email
        }

        try {
            const response = await axios.post(
                `http://${this.host}:8000/api/v2/file/${body.uuid}/delete_aip/`,
                deleteBody,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Erro na chamada HTTP:', error.message);
            throw error;
        }
    }
}
