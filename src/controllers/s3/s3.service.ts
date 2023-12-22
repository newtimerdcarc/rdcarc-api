/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
@Injectable()
export class S3Service {
    getS3() {
        return new S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
        });
    }

    async upload(file, folder): Promise<string> {
        const { originalname } = file;
        const bucketS3 = 'bucket-name';
        const path: string = folder;

        return await this.uploadS3(file.buffer, bucketS3, path + '/' + originalname);
    }

    async uploadS3(file, bucket, name): Promise<string> {
        const s3 = this.getS3();
        const params = {
            Bucket: bucket,
            Key: String(name),
            Body: file,
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    Logger.error(err);
                    reject(err.message);
                } else {
                    resolve(data.Location);
                }
            });
        });
    }

    async deleteFileS3(url: string) {
        const bucketS3 = 'bucket-name';
        const key = this.extractKeyFromUrl(url);
        const s3 = this.getS3();
        const params = {
            Bucket: bucketS3,
            Key: key,
        };

        try {
            await s3.deleteObject(params).promise();
            // Verificar se o arquivo foi realmente excluído consultando o bucket novamente
            const fileExists = await this.checkFileExists(bucketS3, key);
            if (!fileExists) {
                return { message: 'Arquivo excluído com sucesso.' };
            } else {
                throw new Error('Não foi possível excluir o arquivo.');
            }
        } catch (err) {
            console.error('Erro ao excluir o arquivo:', err);
            throw err;
        }
    }

    async checkFileExists(bucket: string, key: string): Promise<boolean> {
        const s3 = this.getS3();
        const params = {
            Bucket: bucket,
            Key: key,
        };

        try {
            await s3.headObject(params).promise();
            return true; // O arquivo existe
        } catch (err) {
            if (err.code === 'NotFound') {
                return false; // O arquivo não existe
            } else {
                throw err;
            }
        }
    }

    extractKeyFromUrl(url: string): string {
        const parts = url.split('/');
        return parts.slice(3).join('/');
    }

}