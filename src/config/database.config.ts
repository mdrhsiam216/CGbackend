import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const createDatabaseConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // Use DATABASE_URL directly if provided (for Railway, Heroku, etc.)
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      synchronize: configService.get<string>('NODE_ENV') === 'development',
      logging: configService.get<boolean>('DATABASE_LOGGING', false),
      entities: [`${__dirname}/../**/**.entity{.ts,.js}`],
      migrations: [`${__dirname}/../database/migrations/**/*{.ts,.js}`],
      migrationsRun: false,
      ssl:
        configService.get<string>('DATABASE_SSL', 'false') === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    };
  }

  // Fall back to individual environment variables
  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USERNAME', 'caregiver_user'),
    password: configService.get<string>(
      'DATABASE_PASSWORD',
      'caregiver_password',
    ),
    database: configService.get<string>('DATABASE_NAME', 'caregiver_db'),
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    logging: configService.get<boolean>('DATABASE_LOGGING', false),
    entities: [`${__dirname}/../**/**.entity{.ts,.js}`],
    migrations: [`${__dirname}/../database/migrations/**/*{.ts,.js}`],
    migrationsRun: false,
    ssl:
      configService.get<string>('DATABASE_SSL', 'false') === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  };
};

export const createDataSource = (configService: ConfigService): DataSource => {
  return new DataSource(createDatabaseConfig(configService));
};
