import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Person } from './person';

@Injectable()
export class PersonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Person[]> {
    return this.prisma.person.findMany();
  }

  async create(data: { name: string }): Promise<Person> {
    return this.prisma.person.create({
      data,
    });
  }
}
