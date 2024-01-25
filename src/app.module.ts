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
import { ArchivedModule } from './controllers/archived/archived.module';
import { EmailController } from './controllers/email/email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
dotenv.config();
@Module({
  imports: [
    S3Module,
    MailerModule.forRoot({
      transport: {
        host: process.env.SES_HOST,
        port: process.env.SES_PORT,
        secure: false,
        auth: {
          user: process.env.USER_SMTP,
          pass: process.env.PASSWORD_SMTP
        }
      }
    }),
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
    ArchivedModule,
  ],
  controllers: [AppController, EmailController],
  providers: [
    AppService,
    AuthService,
  ]
})
export class AppModule { }