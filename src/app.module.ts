/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { config } from './config';
import * as dotenv from 'dotenv';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { SwaggerModule } from '@nestjs/swagger';
import { S3Module } from './controllers/s3/s3.module';
import { UserModule } from './controllers/user/user.module';
import { FileModule } from './controllers/file/file.module';
import { FolderModule } from './controllers/folder/folder.module';
import { PackageModule } from './controllers/package/package.module';
import { ArchivematicaModule } from './controllers/archivematica/archivematica.module';
dotenv.config();
@Module({
  imports: [
    S3Module,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    JwtModule.register({
      secret: 'mySecretKey',
      signOptions: { expiresIn: '24h' },
    }),
    SwaggerModule,
    AuthModule,
    UserModule,
    FileModule,
    FolderModule,
    PackageModule,
    ArchivematicaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
  ]
})
export class AppModule { }