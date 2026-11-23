import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { PersonsRepository } from './persons.repository';
import { PersonsService } from './persons.service';

@Module({
  controllers: [PersonsController],
  providers: [PersonsService, PersonsRepository],
})
export class PersonsModule {}
