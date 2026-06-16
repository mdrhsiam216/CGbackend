import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  username: process.env.DATABASE_USERNAME || 'caregiver_user',
  password: process.env.DATABASE_PASSWORD || 'caregiver_password',
  database: process.env.DATABASE_NAME || 'caregiver_db',
  synchronize: false,
});

async function run() {
  try {
    await dataSource.initialize();
    const users = await dataSource.query(`SELECT id FROM users LIMIT 1`);
    const caregivers = await dataSource.query(
      `SELECT id, "userId" FROM caregiver_profiles LIMIT 1`,
    );
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
