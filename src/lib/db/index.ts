import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Supabase Session Pooler 최적 설정
const client = postgres(connectionString, { 
  max: 10, // Session Pooler는 더 많은 연결 허용
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require', // SSL 필수
});

export const db = drizzle(client, { schema });

export async function closeConnection() {
  await client.end({ timeout: 5 });
}
