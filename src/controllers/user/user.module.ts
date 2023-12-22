/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { S3Module } from '../s3/s3.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/constants';
import { UserProviders } from './user.providers';
import { DatabaseModule } from 'src/database/database.module';
@Module({
    imports: [
        DatabaseModule,
        S3Module,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '360h' },
        }),
    ],
    controllers: [UserController],
    providers: [UserService, ...UserProviders],
    exports: [UserService]
})
export class UserModule { }
