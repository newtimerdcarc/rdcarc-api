/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException, forwardRef } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';
import { PackageService } from '../package/package.service';
import { ArchivalService } from '../archived/archival.service';
import { FileService } from '../file/file.service';
@Injectable()
export class S3Service {
    private readonly userPool: CognitoUserPool;
    private cognitoIdentityServiceProvider: AWS.CognitoIdentityServiceProvider;

    constructor(
        @Inject(forwardRef(() => PackageService)) private readonly packageService: PackageService,
        @Inject(forwardRef(() => ArchivalService)) private readonly archivalService: ArchivalService,
        @Inject(forwardRef(() => FileService)) private readonly fileService: FileService
    ) {
        const poolData = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            ClientId: process.env.COGNITO_CLIENT_ID,
        };
        this.userPool = new CognitoUserPool(poolData);

        const credentials = {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'sa-east-1'
        };

        AWS.config.update(credentials);
        this.cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    }

    getS3() {
        return new S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
        });
    }

    async getBucket(bucket: string): Promise<any> {
        let bucketS3;

        if (bucket === "AIP") {
            bucketS3 = process.env.AIP_BUCKET_NAME;
        }
        else if (bucket === "DIP") {
            bucketS3 = process.env.DIP_BUCKET_NAME;
        }
        else {
            throw new Error('Bucket inválido.');
        }

        const s3 = this.getS3();

        try {
            const listParams = {
                Bucket: bucketS3
            };

            const objects: any = await s3.listObjectsV2(listParams).promise();
            return objects;

        } catch (err) {
            console.error('Erro ao obter o bucket S3:', err);
            throw err;
        }
    }

    generateRandomColor(previousColors: string[]): string {
        const letters = "0123456789ABCDEF";
        let color: string;
        do {
            color = "#";
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
        } while (previousColors.includes(color));
        return color;
    }

    generateRandomColors(quantity: number): string[] {
        const colors: string[] = [];
        for (let i = 0; i < quantity; i++) {
            colors.push(this.generateRandomColor(colors));
        }
        return colors;
    }

    async dashboardStats(bucket_name: string): Promise<any> {
        const bucket: any = await this.getBucket(bucket_name);
        const archivematica = await this.archivalService.findAll();

        const typeFiles1 = await this.getStatusArchivematica(bucket_name, archivematica);
        const labels1 = typeFiles1.map((typeFile: any) => typeFile.status);
        const qtds1 = typeFiles1.map((typeFile: any) => typeFile.qtd);
        const backgroundColor1 = this.generateRandomColors(labels1.length);
        const hoverBackgroundColor1 = this.generateRandomColors(labels1.length);

        const typeFiles2 = await this.getSumSizeStatusArchivematica(bucket_name, archivematica);
        const labels2 = typeFiles2.map((typeFile: any) => typeFile.status);
        const qtds2 = typeFiles2.map((typeFile: any) => typeFile.qtd);
        const backgroundColor2 = this.generateRandomColors(labels2.length);
        const hoverBackgroundColor2 = this.generateRandomColors(labels2.length);

        const typeFiles3 = await this.getTypeFiles(bucket);
        const labels3 = typeFiles3.map((typeFile: any) => typeFile.type);
        const qtds3 = typeFiles3.map((typeFile: any) => typeFile.qtd);
        const backgroundColor3 = this.generateRandomColors(labels3.length);
        const hoverBackgroundColor3 = this.generateRandomColors(labels3.length);

        const qtdFilesPerStatus = {
            labels: labels1,
            datasets: [
                {
                    data: qtds1,
                    backgroundColor: backgroundColor1,
                    hoverBackgroundColor: hoverBackgroundColor1
                }
            ]
        };
        const qtdDataPerStatus = {
            labels: labels2,
            datasets: [
                {
                    data: qtds2,
                    backgroundColor: backgroundColor2,
                    hoverBackgroundColor: hoverBackgroundColor2
                }
            ]
        };
        const typeFiles = {
            labels: labels3,
            datasets: [
                {
                    data: qtds3,
                    backgroundColor: backgroundColor3,
                    hoverBackgroundColor: hoverBackgroundColor3
                }
            ]
        };

        const stats = {
            qtdData: await this.getSumSizes(bucket),
            qtdDataLastWeek: await this.getSumSizesLastWeek(bucket),
            qtdDataLastMonth: await this.getSumSizesLastMonth(bucket),
            qtdDataLastYear: await this.getSumSizesLastYear(bucket),

            qtdFiles: await this.getQtdFiles(bucket),
            qtdFilesLastWeek: await this.getQtdLastWeek(bucket),
            qtdFilesLastMonth: await this.getQtdSizesLastMonth(bucket),
            qtdFilesLastYear: await this.getQtdSizesLastYear(bucket),

            qtdDataPerStatus,
            qtdFilesPerStatus,
            typeFiles
        }

        return stats;
    }

    async getSumSizes(bucket: any): Promise<any> {
        // const bucket: any = await this.getBucket();
        if (bucket.Contents && Array.isArray(bucket.Contents)) {
            const somaSizes = bucket.Contents.reduce((soma, item) => soma + item.Size, 0);
            return this.bytesToKB(somaSizes);
        } else {
            return "0 KB";
        }
    }

    async getSumSizesLastWeek(bucket: any): Promise<any> {
        if (bucket.Contents && Array.isArray(bucket.Contents)) {
            const dataAtual = new Date();
            const seteDiasAtras = new Date(dataAtual);
            seteDiasAtras.setDate(dataAtual.getDate() - 7);

            // Filtra os itens cuja data de modificação está na última semana
            const itensUltimaSemana = bucket.Contents.filter(
                item => new Date(item.LastModified) >= seteDiasAtras && new Date(item.LastModified) <= dataAtual
            );

            // Calcula a soma dos tamanhos desses itens
            const somaSizes = itensUltimaSemana.reduce((soma, item) => soma + item.Size, 0);

            return this.bytesToKB(somaSizes);
        } else {
            return "0 KB";
        }
    }

    async getSumSizesLastMonth(bucket: any): Promise<any> {
        if (bucket.Contents && Array.isArray(bucket.Contents)) {
            const dataAtual = new Date();
            const primeiroDiaMesAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
            const primeiroDiaMesAnterior = new Date(primeiroDiaMesAtual);
            primeiroDiaMesAnterior.setMonth(primeiroDiaMesAtual.getMonth() - 1);

            // Filtra os itens cuja data de modificação está no mês anterior
            const itensMesAnterior = bucket.Contents.filter(
                item => new Date(item.LastModified) >= primeiroDiaMesAnterior && new Date(item.LastModified) < primeiroDiaMesAtual
            );

            // Calcula a soma dos tamanhos desses itens
            const somaSizes = itensMesAnterior.reduce((soma, item) => soma + item.Size, 0);

            return this.bytesToKB(somaSizes);
        } else {
            return "0 KB";
        }
    }

    async getSumSizesLastYear(bucket: any): Promise<any> {
        if (bucket.Contents && Array.isArray(bucket.Contents)) {
            const dataAtual = new Date();
            const primeiroDiaAnoAtual = new Date(dataAtual.getFullYear(), 0, 1);
            const primeiroDiaAnoPassado = new Date(primeiroDiaAnoAtual);
            primeiroDiaAnoPassado.setFullYear(primeiroDiaAnoAtual.getFullYear() - 1);

            // Filtra os itens cuja data de modificação está no ano passado
            const itensAnoPassado = bucket.Contents.filter(
                item => new Date(item.LastModified) >= primeiroDiaAnoPassado && new Date(item.LastModified) < primeiroDiaAnoAtual
            );

            // Calcula a soma dos tamanhos desses itens
            const somaSizes = itensAnoPassado.reduce((soma, item) => soma + item.Size, 0);

            return this.bytesToKB(somaSizes);
        } else {
            return "0 KB";
        }
    }

    bytesToKB(bytes: number): string {
        if (bytes < 2 * 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else if (bytes < 999 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        }
    }

    bytesToMB(bytes: number): number {
        return Math.round((bytes / (1024 * 1024)) * 100) / 100;
    }

    async getQtdFiles(objects: any): Promise<number> {
        const bucket = objects.Contents.filter(objeto => objeto.Size > 0);
        if (bucket && Array.isArray(bucket)) {
            return bucket.length;
        } else {
            return 0;
        }
    }

    async getQtdLastWeek(objects: any): Promise<number> {
        const bucket = objects.Contents.filter(objeto => objeto.Size > 0);

        if (bucket && Array.isArray(bucket)) {
            const dataAtual = new Date();
            const seteDiasAtras = new Date(dataAtual);
            seteDiasAtras.setDate(dataAtual.getDate() - 7);
            const itensUltimos7Dias = bucket.filter(
                item => new Date(item.LastModified) >= seteDiasAtras
            );
            return itensUltimos7Dias.length;
        } else {
            return 0;
        }
    }

    async getQtdSizesLastMonth(objects: any): Promise<number> {
        const bucket = objects.Contents.filter(objeto => objeto.Size > 0);

        if (bucket && Array.isArray(bucket)) {
            const dataAtual = new Date();
            const primeiroDiaMesAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
            const primeiroDiaMesAnterior = new Date(primeiroDiaMesAtual);
            primeiroDiaMesAnterior.setMonth(primeiroDiaMesAtual.getMonth() - 1);
            const itensMesAnterior = bucket.filter(
                item => new Date(item.LastModified) >= primeiroDiaMesAnterior && new Date(item.LastModified) < primeiroDiaMesAtual
            );
            return itensMesAnterior.length;
        } else {
            return 0;
        }
    }

    async getQtdSizesLastYear(objects: any): Promise<number> {
        const bucket = objects.Contents.filter(objeto => objeto.Size > 0);

        if (bucket && Array.isArray(bucket)) {
            const dataAtual = new Date();
            const primeiroDiaAnoAtual = new Date(dataAtual.getFullYear(), 0, 1);
            const primeiroDiaAnoPassado = new Date(primeiroDiaAnoAtual);
            primeiroDiaAnoPassado.setFullYear(primeiroDiaAnoAtual.getFullYear() - 1);
            const itensAnoPassado = bucket.filter(
                item => new Date(item.LastModified) >= primeiroDiaAnoPassado && new Date(item.LastModified) < primeiroDiaAnoAtual
            );

            return itensAnoPassado.length;
        } else {
            return 0;
        }
    }

    async getTypeFiles(objects: any): Promise<any[]> {
        const bucket = objects.Contents.filter(objeto => objeto.Size > 0);
        const tiposContagem: { [key: string]: number } = {};
        if (bucket && Array.isArray(bucket)) {
            bucket.forEach(item => {
                const extensao = item.Key.split('.').pop();
                tiposContagem[extensao] = (tiposContagem[extensao] || 0) + 1;
            });
            const tiposArray = Object.entries(tiposContagem).map(([type, qtd]) => ({ type, qtd }));
            return tiposArray;
        } else {
            return [];
        }
    }

    async getStatusArchivematica(type: string, objects: any): Promise<any[]> {
        const bucket = objects.filter(objeto => objeto.package_type === type);
        const tiposContagem: { [key: string]: number } = {};
        if (bucket && Array.isArray(bucket)) {
            bucket.forEach(item => {
                tiposContagem[item.status] = (tiposContagem[item.status] || 0) + 1;
            });
            const tiposArray = Object.entries(tiposContagem).map(([status, qtd]) => ({ status, qtd }));
            return tiposArray;
        } else {
            return [];
        }
    }

    async getSumSizeStatusArchivematica(type: string, objects: any): Promise<any[]> {
        const bucket = objects.filter(objeto => objeto.package_type === type);
        const tiposContagem: { [key: string]: number } = {};
        if (bucket && Array.isArray(bucket)) {
            bucket.forEach(item => {
                tiposContagem[item.status] = (tiposContagem[item.status] || 0) + Number(item.size);
            });
            const tiposArray = Object.entries(tiposContagem).map(([status, qtd]) => ({ status, qtd }));
            // Convertendo as quantidades para megabytes
            tiposArray.forEach(item => {
                item.qtd = this.bytesToMB(item.qtd);
            });
            return tiposArray;
        } else {
            return [];
        }
    }

    private removeS3UrlPrefix(url: string): string {
        let resultado = url.replace("https://transfersource-prod.s3.sa-east-1.amazonaws.com/", "");
        resultado = resultado.replace(/\.[^/.]+$/, ".xml");
        return resultado;
    }

    async uploadXmlToS3(file: any): Promise<void> {
        const s3 = this.getS3();
        const xmlContent = `
        <?xml version="1.0" encoding="UTF-8"?>
    <metadata>
        <contributor>${file.contributor}</contributor>
        <coverage>${file.coverage}</coverage>
        <creator>${file.creator}</creator>
        <date>2023-03-23</date>
        <description>${file.description}</description>
        <format>${file.format}</format>
        <identifier>${file.identifier}</identifier>
        <language>${file.language}</language>
        <publisher>${file.publisher}</publisher>
        <relation>${file.relation}</relation>
        <rights>${file.rights}</rights>
        <source>${file.source}</source>
        <subject>${file.subject}</subject>
        <title>${file.title}</title>
        <type>${file.type}</type>
    </metadata>`

        const path = this.removeS3UrlPrefix(file.url);

        const params: S3.PutObjectRequest = {
            Bucket: process.env.BUCKET_NAME,
            Key: path,
            Body: xmlContent,
            ContentType: 'text/xml'
        };

        try {
            await s3.putObject(params).promise();
        } catch (error) {
            throw error;
        }
    }

    async upload(file, folder): Promise<string> {
        const { originalname } = file;
        const bucketS3 = process.env.BUCKET_NAME;
        const path: string = folder;

        // Verifica se o tamanho é maior que 100MB
        if (file.size > 100 * 1024 * 1024) {
            return await this.uploadMultipart(file.buffer, bucketS3, path + '/' + originalname);
        } else {
            return await this.uploadS3(file.buffer, bucketS3, path + '/' + originalname);
        }
    }

    async uploadMultipart(fileBuffer, bucket, key): Promise<string> {
        const s3 = this.getS3();
        // Passo 1: Inicia o upload multipart
        const createMultipartUploadResponse = await s3.createMultipartUpload({
            Bucket: bucket,
            Key: key,
        }).promise();

        const uploadId = createMultipartUploadResponse.UploadId;

        // Passo 2: Divide o arquivo em partes e faz o upload de cada parte
        const partSize = 200 * 1024 * 1024; // 200MB por parte
        const numParts = Math.ceil(fileBuffer.length / partSize);
        const uploadPromises = [];

        for (let i = 0; i < numParts; i++) {
            const start = i * partSize;
            const end = Math.min(start + partSize, fileBuffer.length);

            const uploadPartResponse = await s3.uploadPart({
                Bucket: bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: i + 1,
                Body: fileBuffer.slice(start, end),
            }).promise();

            uploadPromises.push({
                PartNumber: i + 1,
                ETag: uploadPartResponse.ETag,
            });
        }

        // Passo 3: Completa o upload multipart
        const completeMultipartUploadResponse = await s3.completeMultipartUpload({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: uploadPromises,
            },
        }).promise();

        return completeMultipartUploadResponse.Location;
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
        const bucketS3 = process.env.BUCKET_NAME;
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

    async generateAipPresignedUrl(fileName: string): Promise<any> {
        const s3 = this.getS3();
        const params = {
            Bucket: process.env.AIP_BUCKET_NAME,
            Key: fileName,
            Expires: 3600,
        };

        const res = {
            url: ''
        }

        res.url = await s3.getSignedUrl('getObject', params);
        return res;
    }

    async generateDipPresignedUrl(fileName: string): Promise<any> {
        const s3 = this.getS3();
        const params = {
            Bucket: process.env.DIP_BUCKET_NAME,
            Key: fileName,
            Expires: 3600,
        };

        const res = {
            url: ''
        }

        res.url = await s3.getSignedUrl('getObject', params);
        return res;
    }

    async generateUrl(url: string): Promise<{ url: string }> {
        const s3 = this.getS3();
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: this.extractKeyFromUrl(url),
            Expires: 3600,
        };

        const res = {
            url: '',
        };

        res.url = await s3.getSignedUrlPromise('getObject', params);
        return res;
    }

    async deleteFolderS3(folderPath: string) {
        const bucketS3 = process.env.BUCKET_NAME;
        const s3 = this.getS3();

        await this.packageService.deletePackage(folderPath);

        try {
            // Listar objetos na "pasta"
            const listParams = {
                Bucket: bucketS3,
                Prefix: folderPath,
            };

            const objects = await s3.listObjectsV2(listParams).promise();

            // Criar uma lista de objetos para exclusão
            const deleteParams = {
                Bucket: bucketS3,
                Delete: { Objects: [] },
            };

            objects.Contents.forEach(obj => {
                deleteParams.Delete.Objects.push({ Key: obj.Key });
            });

            // Excluir objetos
            if (deleteParams.Delete.Objects.length > 0) {
                await s3.deleteObjects(deleteParams).promise();
            }

            // Excluir a própria "pasta"
            await s3.deleteObject({ Bucket: bucketS3, Key: folderPath }).promise();

            // Verificar se a "pasta" foi realmente excluída consultando o bucket novamente
            const folderExists = await this.checkFileExists(bucketS3, folderPath);
            if (!folderExists) {
                return { message: 'Pasta e seus arquivos excluídos com sucesso.' };
            } else {
                throw new Error('Não foi possível excluir a pasta e seus arquivos.');
            }
        } catch (err) {
            console.error('Erro ao excluir a pasta no S3:', err);
            throw err;
        }
    }

    async deleteFolderNoPackageS3(folderPath: string) {
        const bucketS3 = process.env.BUCKET_NAME;
        const s3 = this.getS3();

        try {
            // Listar objetos na "pasta"
            const listParams = {
                Bucket: bucketS3,
                Prefix: folderPath,
            };

            const objects = await s3.listObjectsV2(listParams).promise();

            // Criar uma lista de objetos para exclusão
            const deleteParams = {
                Bucket: bucketS3,
                Delete: { Objects: [] },
            };

            objects.Contents.forEach(obj => {
                deleteParams.Delete.Objects.push({ Key: obj.Key });
            });

            // Excluir objetos
            if (deleteParams.Delete.Objects.length > 0) {
                await s3.deleteObjects(deleteParams).promise();
            }

            // Excluir a própria "pasta"
            await s3.deleteObject({ Bucket: bucketS3, Key: folderPath }).promise();

            // Verificar se a "pasta" foi realmente excluída consultando o bucket novamente
            const folderExists = await this.checkFileExists(bucketS3, folderPath);
            if (!folderExists) {
                return { message: 'Pasta e seus arquivos excluídos com sucesso.' };
            } else {
                throw new Error('Não foi possível excluir a pasta e seus arquivos.');
            }
        } catch (err) {
            console.error('Erro ao excluir a pasta no S3:', err);
            throw err;
        }
    }

    async renameFolderS3(folderPath: string, newName: string) {
        const bucketS3 = process.env.BUCKET_NAME;
        const s3 = this.getS3();

        try {
            // Listar objetos na "pasta" original
            const listParams = {
                Bucket: bucketS3,
                Prefix: folderPath,
            };

            const objects = await s3.listObjectsV2(listParams).promise();

            // Criar uma lista de objetos para copiar
            const copyParams = {
                Bucket: bucketS3,
                CopySource: '',
                Key: '',
            };

            // Copiar cada objeto com o novo nome
            for (const obj of objects.Contents) {
                copyParams.CopySource = `${bucketS3}/${obj.Key}`;
                copyParams.Key = obj.Key.replace(folderPath, newName);

                await s3.copyObject(copyParams).promise();

                // Renomear objetos aninhados (caso sejam "pastas" também)
                if (obj.Key.endsWith('/')) {
                    // Iterar pelos objetos aninhados usando um loop
                    let subFolderPath = obj.Key;
                    while (subFolderPath !== folderPath) {
                        const subListParams = {
                            Bucket: bucketS3,
                            Prefix: subFolderPath,
                        };

                        const subObjects = await s3.listObjectsV2(subListParams).promise();

                        for (const subObj of subObjects.Contents) {
                            copyParams.CopySource = `${bucketS3}/${subObj.Key}`;
                            copyParams.Key = subObj.Key.replace(folderPath, newName);

                            await s3.copyObject(copyParams).promise();
                        }

                        subFolderPath = subFolderPath.substring(0, subFolderPath.lastIndexOf('/'));
                    }
                }
            }

            // Excluir objetos originais
            const deleteParams = {
                Bucket: bucketS3,
                Delete: { Objects: [] },
            };

            objects.Contents.forEach(obj => {
                deleteParams.Delete.Objects.push({ Key: obj.Key });
            });

            // Excluir objetos originais
            if (deleteParams.Delete.Objects.length > 0) {
                await s3.deleteObjects(deleteParams).promise();
            }

            // Verificar se a "pasta" original foi realmente excluída consultando o bucket novamente
            const folderExists = await this.checkFileExists(bucketS3, folderPath);
            if (!folderExists) {
                // return { message: 'Pasta renomeada com sucesso.' };
                return true;
            } else {
                throw new Error('Não foi possível renomear a pasta.');
            }
        } catch (err) {
            console.error('Erro ao renomear a pasta no S3:', err);
            throw err;
        }
    }

    async getSizeTransferFolderS3(folderPath: string): Promise<any> {
        const bucketS3 = process.env.BUCKET_NAME;
        const s3 = this.getS3();

        try {
            // Listar objetos na "pasta"
            const listParams = {
                Bucket: bucketS3,
                Prefix: `${folderPath}`,
            };

            const objects: any = await s3.listObjectsV2(listParams).promise();

            const objetos = objects.Contents.filter(objeto => objeto.Size > 0);

            // Obter KeyCount e soma do campo Size
            const keyCount = objects.KeyCount;
            const totalSize = objetos.reduce((acc, objeto) => acc + objeto.Size, 0);

            return { keyCount, totalSize };

        } catch (err) {
            console.error('Erro ao obter a pasta no S3:', err);
            throw err;
        }
    }

    async getFolderS3(folderPath: string): Promise<any> {
        const bucketS3 = process.env.DIP_BUCKET_NAME;
        const s3 = this.getS3();

        try {
            // Listar objetos na "pasta"
            const listParams = {
                Bucket: bucketS3,
                Prefix: `${folderPath}`,
            };

            const objects = await s3.listObjectsV2(listParams).promise();

            const objetos = objects.Contents.filter(objeto => objeto.Size > 0);
            return objetos;

        } catch (err) {
            console.error('Erro ao obter a pasta no S3:', err);
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

    async getAllObjectsInBucket(path: string): Promise<any[]> {
        const s3 = this.getS3();
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Prefix: path,
        };

        try {
            const result = await s3.listObjectsV2(params).promise();

            if (result.Contents.length > 0) {
                const objects = result.Contents.map((object) => ({
                    key: object.Key,
                    size: object.Size,
                    lastModified: object.LastModified,
                    etag: object.ETag,
                    owner: object.Owner,
                    url: this.getObjectUrl(process.env.BUCKET_NAME, object.Key),
                    fileName: this.getFileNameFromKey(object.Key)
                }));

                return objects;
            } else {
                return [];
            }
        } catch (err) {
            Logger.error(`Error listing objects in bucket: ${err.message}`);
            throw err;
        }
    }

    getObjectUrl(bucket: string, key: string): string {
        const s3 = this.getS3();
        const endpoint = new URL(s3.endpoint.href);
        endpoint.pathname = `${bucket}/${key}`;
        return endpoint.href;
    }

    getFileNameFromKey(key: string): string {
        const fileNameWithExtension = key.split('/').pop();
        return fileNameWithExtension ? fileNameWithExtension.split('.')[0] : '';
    }

    extractKeyFromUrl(url: string): string {
        const decodedUrl = decodeURIComponent(url);
        const parts = decodedUrl.split('/');
        return parts.slice(3).join('/');
    }

    // COGNITO
    async createUserInCognito(user: any): Promise<void> {
        const attributeList = [
            new CognitoUserAttribute({ Name: 'name', Value: `${user.first_name} ${user.last_name}` }),
            new CognitoUserAttribute({ Name: 'email', Value: user.username }),
            // Adicione outros atributos conforme necessário
        ];

        return new Promise<void>((resolve, reject) => {
            this.userPool.signUp(user.username, user.password, attributeList, [], (err) => {
                if (err) {
                    console.error('Erro ao criar usuário no Cognito:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async confirmUserInCognito(email: string, confirmationCode: string): Promise<boolean> {
        const userData = {
            Username: email,
            Pool: this.userPool,
        };

        const cognitoUser = new CognitoUser(userData);

        try {
            await new Promise<void>((resolve, reject) => {
                cognitoUser.confirmRegistration(confirmationCode, true, (err) => {
                    if (err) {
                        console.error('Erro ao confirmar usuário no Cognito:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    async resendConfirmationCode(username: string): Promise<any> {
        try {
            // Obtendo o usuário do Amazon Cognito
            const cognitoUser = await this.getUserByUsername(username);

            // Reenviando o código de confirmação
            await this.resendConfirmationCodeInCognito(cognitoUser);

            return { message: 'Código de confirmação reenviado com sucesso.' };
        } catch (error) {
            console.error('Erro ao reenviar código de confirmação:', error);
            throw new HttpException('Erro ao reenviar código de confirmação', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private getUserByUsername(username: string): Promise<CognitoUser> {
        const userData = {
            Username: username,
            Pool: this.userPool,
        };

        const cognitoUser = new CognitoUser(userData);

        return new Promise<CognitoUser>((resolve) => {
            resolve(cognitoUser);
        });
    }

    private resendConfirmationCodeInCognito(cognitoUser: CognitoUser): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            cognitoUser.resendConfirmationCode((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
        try {
            const authenticationDetails = new AuthenticationDetails({
                Username: username,
                Password: oldPassword,
            });

            const userData = {
                Username: username,
                Pool: this.userPool,
            };

            const cognitoUser = new CognitoUser(userData);

            await this.authenticateUser(cognitoUser, authenticationDetails);

            await this.changePasswordInCognito(cognitoUser, oldPassword, newPassword);

            return true;  // Retorna true se a alteração de senha for bem-sucedida
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            throw new HttpException('Erro ao alterar senha', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private authenticateUser(cognitoUser: CognitoUser, authenticationDetails: AuthenticationDetails): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onSuccess: (session) => {
                    // Autenticação bem-sucedida
                    resolve();
                },
                onFailure: (err) => {
                    // Falha na autenticação
                    reject(err);
                },
            });
        });
    }

    private changePasswordInCognito(cognitoUser: CognitoUser, oldPassword: string, newPassword: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            cognitoUser.changePassword(oldPassword, newPassword, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async login(username: string, password: string): Promise<string> {
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const userData = {
            Username: username,
            Pool: this.userPool,
        };

        const cognitoUser = new CognitoUser(userData);

        try {
            await this.authenticateUser(cognitoUser, authenticationDetails);
            return 'Login bem-sucedido';
        } catch (error) {
            console.error('Erro ao autenticar usuário:', error);
            throw new UnauthorizedException('Credenciais inválidas');
        }
    }

    async deleteUserInCognito(username: string, password: string): Promise<void> {
        try {
            const authenticationDetails = new AuthenticationDetails({
                Username: username,
                Password: password,
            });

            const userData = {
                Username: username,
                Pool: this.userPool,
            };

            const cognitoUser = new CognitoUser(userData);
            await this.authenticateUser(cognitoUser, authenticationDetails);
            await this.deleteUserFromCognito(cognitoUser);
            return;
        } catch (error) {
            console.error('Erro ao excluir usuário do Cognito:', error);

            // Verificar se o erro é devido ao usuário não confirmado
            if (error.code === 'UserNotConfirmedException') {
                return await this.deleteUnconfirmedUserFromCognito(username);
            }
            throw new HttpException('Erro ao excluir usuário do Cognito', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private deleteUserFromCognito(cognitoUser: CognitoUser): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            cognitoUser.deleteUser((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async deleteUnconfirmedUserFromCognito(username: string): Promise<void> {
        const params: AWS.CognitoIdentityServiceProvider.AdminDeleteUserRequest = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
        };

        await this.cognitoIdentityServiceProvider.adminDeleteUser(params).promise();
    }
}