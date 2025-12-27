import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JobType } from '../src/entities';

describe('Job Processing (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure validation pipe for E2E tests
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Register and login to get auth token
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'job-test@example.com',
      password: 'TestPassword123!',
      name: 'Job Test User',
    });

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'job-test@example.com',
      password: 'TestPassword123!',
    });

    authToken = loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 30000);

  describe('/jobs (POST)', () => {
    it('should submit a code execution job', async () => {
      const jobData = {
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'console.log("Hello, World!");',
          language: 'javascript',
          timeout: 30000,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: JobType.CODE_EXECUTION,
        status: 'pending',
        data: jobData.data,
        result: null,
        errorMessage: null,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should reject invalid job type', async () => {
      const jobData = {
        type: 'invalid_type',
        data: { code: 'test' },
      };

      await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);
    });

    it('should reject request without authentication', async () => {
      const jobData = {
        type: JobType.CODE_EXECUTION,
        data: { code: 'test' },
      };

      await request(app.getHttpServer()).post('/jobs').send(jobData).expect(401);
    });
  });

  describe('/jobs (GET)', () => {
    it('should get user jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('/jobs/stats (GET)', () => {
    it.skip('should get queue statistics (requires Redis)', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('codeExecution');
      expect(response.body).toHaveProperty('fileProcessing');
      expect(response.body).toHaveProperty('workspaceExport');
    }, 10000);
  });
});
