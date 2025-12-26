import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const isProduction = configService.get('NODE_ENV') === 'production';
  const databaseUrl = configService.get('database.url');

  if (isProduction && databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: false,
      autoLoadEntities: true,
    };
  }

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: isDevelopment,
      logging: isDevelopment,
      autoLoadEntities: true,
    };
  }

  return {
    type: 'postgres',
    host: configService.get('database.host'),
    port: configService.get('database.port'),
    username: configService.get('database.username'),
    password: configService.get('database.password'),
    database: configService.get('database.name'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: isDevelopment,
    logging: isDevelopment,
    autoLoadEntities: true,
    ssl: configService.get('database.ssl')
      ? {
          rejectUnauthorized: false,
        }
      : false,
  };
};
