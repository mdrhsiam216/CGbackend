import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;

const isProduction =
  process.env.NODE_ENV === 'production' || !__filename.endsWith('.ts');

const entityPath = isProduction
  ? path.join(__dirname, '../modules/**/*.entity.js')
  : path.join(__dirname, '../modules/**/*.entity.ts');

const migrationPath = isProduction
  ? path.join(__dirname, '../database/migrations/*.js')
  : path.join(__dirname, '../database/migrations/*.ts');

const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        synchronize: false, // Always false - use migrations in production
        entities: [entityPath],
        migrations: [migrationPath],
        migrationsRun: false, // We'll run manually via CLI
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? {
                rejectUnauthorized: false,
              }
            : false,
        logging: process.env.DATABASE_LOGGING === 'true',
      }
    : {
        // Fall back to individual environment variables
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME || 'caregiver_user',
        password: process.env.DATABASE_PASSWORD || 'caregiver_password',
        database: process.env.DATABASE_NAME || 'caregiver_db',
        synchronize: process.env.NODE_ENV === 'development',
        entities: [entityPath],
        migrations: [migrationPath],
        migrationsRun: false,
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? {
                rejectUnauthorized: false,
              }
            : false,
        logging: process.env.DATABASE_LOGGING === 'true',
      },
);

export default AppDataSource;
