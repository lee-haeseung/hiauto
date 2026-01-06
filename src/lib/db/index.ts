import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Serverless 환경을 위한 설정
const client = postgres(connectionString, { 
  prepare: false,
  max: 1, // Vercel Serverless 최적화
});

export const db = drizzle(client, { schema });
