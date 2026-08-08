import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'allchrono',
  password: process.env.DATABASE_PASSWORD ?? 'allchrono_dev',
  database: process.env.DATABASE_NAME ?? 'allchrono',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
