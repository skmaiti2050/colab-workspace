import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Password Validation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should accept strong password', () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'MySecurePass123!',
        })
        .expect(201);
    });

    it('should reject weak password (no uppercase)', () => {
      const uniqueEmail = `test-${Date.now()}-1@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'mysecurepass123!',
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          );
        });
    });

    it('should reject weak password (no lowercase)', () => {
      const uniqueEmail = `test-${Date.now()}-2@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'MYSECUREPASS123!',
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          );
        });
    });

    it('should reject weak password (no number)', () => {
      const uniqueEmail = `test-${Date.now()}-3@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'MySecurePass!',
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          );
        });
    });

    it('should reject weak password (no special character)', () => {
      const uniqueEmail = `test-${Date.now()}-4@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'MySecurePass123',
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          );
        });
    });

    it('should reject short password', () => {
      const uniqueEmail = `test-${Date.now()}-5@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Test User',
          password: 'Pass1!',
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('Password must be at least 8 characters long');
        });
    });
  });
});
