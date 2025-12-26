import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import configuration from '../src/config/configuration';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_HOST = 'localhost';
  process.env.DATABASE_PORT = '5432';
  process.env.DATABASE_USERNAME = 'postgres';
  process.env.DATABASE_PASSWORD = 'password';
  process.env.DATABASE_NAME = 'test_collaborative_workspace';
});

export const createTestModule = async (providers: any[] = [], imports: any[] = []) => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
      }),
      ...imports,
    ],
    providers,
  }).compile();
};

export const PBT_CONFIG = {
  numRuns: 100,
  timeout: 5000,
  verbose: false,
};
