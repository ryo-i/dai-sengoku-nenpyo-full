import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CreatePersonDto } from '../persons/dto/create-person.dto';
import { PersonResponseDto } from '../persons/dto/person-response.dto';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('NextNest API')
    .setDescription('Next.js + NestJS starter kit API')
    .setVersion('1.0')
    .build();
}

export function createOpenApiDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, buildSwaggerConfig(), {
    extraModels: [PersonResponseDto, CreatePersonDto],
  });
}
