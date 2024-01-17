/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/controllers/user/user.module';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { S3Module } from 'src/controllers/s3/s3.module';
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
    S3Module
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy]
})
export class AuthModule { }