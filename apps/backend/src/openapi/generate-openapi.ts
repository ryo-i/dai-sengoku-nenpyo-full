import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { createOpenApiDocument } from './swagger.config';

async function generate() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    preview: true,
  });
  const document = createOpenApiDocument(app);
  const outPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void generate();
