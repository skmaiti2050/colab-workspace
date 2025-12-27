import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const createRedisConfig = (configService: ConfigService): RedisOptions | string => {
  const redisUrl = configService.get<string>('redis.url');

  if (redisUrl) {
    return redisUrl;
  }

  const config: RedisOptions = {
    host: configService.get<string>('redis.host'),
    port: configService.get<number>('redis.port'),
    connectionName: 'default',
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  const password = configService.get<string>('redis.password');
  if (password) {
    config.password = password;
  }

  const db = configService.get<number>('redis.db');
  if (db !== undefined && db !== null) {
    config.db = db;
  }

  return config;
};

export const createRedisUrlFromConfig = (configService: ConfigService): string => {
  const redisUrl = configService.get<string>('redis.url');

  if (redisUrl) {
    return redisUrl;
  }

  const host = configService.get<string>('redis.host');
  const port = configService.get<number>('redis.port');
  const password = configService.get<string>('redis.password');
  const db = configService.get<number>('redis.db');

  let url = `redis://`;
  if (password) {
    url += `:${password}@`;
  }
  url += `${host}:${port}`;
  if (db !== undefined && db !== null && db !== 0) {
    url += `/${db}`;
  }

  return url;
};
