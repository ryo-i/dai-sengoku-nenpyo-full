import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Get('persons')
  async getPersons() {
    return await this.appService.getPersons();
  }

  @Get()
  getRoot() {
    return { message: 'Welcome to the API!' };
  }
}
