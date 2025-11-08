// db.ts - Use Neon serverless driver for migrations
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

import dotenv from "dotenv";
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use Pool for migrations and complex operations
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Use single connection for migrations
});

export const db = drizzle(pool, { schema });

// Helper function for raw SQL execution
export async function executeSQL(query: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(query);
    return result;
  } finally {
    client.release();
  }
}