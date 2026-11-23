import { Injectable } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonsRepository } from './persons.repository';

@Injectable()
export class PersonsService {
  constructor(private readonly personsRepository: PersonsRepository) {}

  /**
   * 人物一覧を取得します。
   */
  async getPersons() {
    return this.personsRepository.findAll();
  }

  /**
   * 人物を作成します。
   */
  async createPerson(createPersonDto: CreatePersonDto) {
    return this.personsRepository.create(createPersonDto);
  }
}
