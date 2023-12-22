/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  constructor() {}

  getHello(): string {
    return 'GED-API RODANDO!';
  }
}
