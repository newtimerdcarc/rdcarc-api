/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY') private userRepository: Repository<User>,
    @Inject(forwardRef(() => S3Service)) private readonly s3Service: S3Service,
  ) { }

  async create(user: User): Promise<User> {
    const verifyUser = await this.findEmail(user.username);

    if (verifyUser) {
      throw new HttpException('Usuario ja cadastrado', HttpStatus.BAD_REQUEST);
    }

    //cria usuário no cognito
    this.s3Service.createUserInCognito(user);

    user.id = uuidv4()
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: any): Promise<User> {
    const verifyUser = await this.userRepository.findOne({ where: { id } });

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    return verifyUser;
  }

  async findEmail(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    return user;
  }

  async update(id: string, user: any): Promise<User> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    // Atualiza os campos do usuário apenas se eles não forem nulos
    verifyUser.first_name = user.first_name || verifyUser.first_name;
    verifyUser.last_name = user.last_name || verifyUser.last_name;
    verifyUser.type = user.type || verifyUser.type;
    verifyUser.cpf = user.cpf || verifyUser.cpf;
    verifyUser.phone = user.phone || verifyUser.phone;
    verifyUser.api_key = user.api_key || verifyUser.api_key;
    verifyUser.user_archivematica = user.user_archivematica || verifyUser.user_archivematica;

    await this.userRepository.update(id, verifyUser);
    return this.findOne(id);
  }

  async updatePassword(id: any, newPassword: string): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.s3Service.changePassword(verifyUser.username, verifyUser.password, newPassword);

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: newPassword })
      .where("id = :id", { id })
      .execute();

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuário não encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository.delete(id);
  }

  async blockUser(id: any): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ active: false })
      .where("id = :id", { id })
      .execute();

    return await this.findOne(id);
  }

  async unblockUser(id: any): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ active: true })
      .where("id = :id", { id })
      .execute();

    return await this.findOne(id);
  }

  async firstLogin(id: any): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ first_login: false })
      .where("id = :id", { id })
      .execute();

    return await this.findOne(id);
  }

  async setUserArchiv(id: any, user_archivematica: string): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ user_archivematica })
      .where("id = :id", { id })
      .execute();

    return await this.findOne(id);
  }

  //COGNITO
  async confirmUser(email: string, confirmationCode: string): Promise<any> {
    const confirm = await this.s3Service.confirmUserInCognito(email, confirmationCode);
    if (!confirm) {
      throw new HttpException('Código inválido', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const user = await this.findEmail(email);
    await this.firstLogin(user.id);
    return user;
  }

}
