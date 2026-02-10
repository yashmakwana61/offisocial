import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// We initialize these lazily or allow them to be undefined if DB_URL is missing
// to prevent top-level crashes in environments like Vercel (during build or if env is missing)
const databaseUrl = process.env.DATABASE_URL?.trim();
export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

if (!pool && process.env.NODE_ENV === "production") {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

export const db = pool ? drizzle(pool, { schema }) : null as any;

