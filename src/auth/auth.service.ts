/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/controllers/user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findEmail(email);

    if (user && pass === user.password) {
      return { ...user };
    }

    return null;
  }

  async validateToken(id: string): Promise<any> {
    const user = await this.userService.findOne(id);

    if (user) {
      return { ...user };
    }

    return null;
  }
}