/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY') private userRepository: Repository<User>,
  ) { }

  async create(user: User): Promise<User> {
    const verifyUser = await this.findEmail(user.username);

    if (verifyUser) {
      throw new HttpException('Usuario ja cadastrado', HttpStatus.BAD_REQUEST);
    }

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

  generateStrongPassword(): string {
    const length = 8;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }

    return password;
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

    await this.userRepository.update(id, verifyUser);
    return this.findOne(id);
  }

  async updatePassword(id: any, newPassword: string): Promise<any> {
    const verifyUser = await this.findOne(id);

    if (!verifyUser) {
      throw new HttpException('Usuario nao encontrado', HttpStatus.BAD_REQUEST);
    }

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

}
