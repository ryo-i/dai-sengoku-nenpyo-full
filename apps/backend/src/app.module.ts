import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PersonsModule } from './persons/persons.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, PersonsModule],
  controllers: [AppController],
})
export class AppModule {}
