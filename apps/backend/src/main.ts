import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createOpenApiDocument } from './openapi/swagger.config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  });
  SwaggerModule.setup('api', app, createOpenApiDocument(app));
  await app.listen(process.env.PORT ?? process.env.BACKEND_PORT ?? 3001);
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
