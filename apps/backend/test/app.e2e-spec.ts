import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const prismaServiceMock = {
      person: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, name: '織田信長' },
          { id: 2, name: '豊臣秀吉' },
        ]),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 3,
          ...data,
        })),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ message: 'Welcome to the API!' });
  });

  it('/persons (GET)', () => {
    return request(app.getHttpServer())
      .get('/persons')
      .expect(200)
      .expect([
        { id: 1, name: '織田信長' },
        { id: 2, name: '豊臣秀吉' },
      ]);
  });

  it('/persons (POST)', () => {
    return request(app.getHttpServer())
      .post('/persons')
      .send({ name: '明智光秀' })
      .expect(201)
      .expect({ id: 3, name: '明智光秀' });
  });

  it('/persons (POST) should validate body', () => {
    return request(app.getHttpServer()).post('/persons').send({}).expect(400);
  });
});
