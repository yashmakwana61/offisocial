import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pkg;

// We initialize these lazily or allow them to be undefined if DB_URL is missing
// to prevent top-level crashes in environments like Vercel (during build or if env is missing)
const databaseUrl = process.env.DATABASE_URL?.trim();

if (databaseUrl) {
  const obscuredUrl = databaseUrl.length > 20
    ? `${databaseUrl.slice(0, 10)}...${databaseUrl.slice(-5)}`
    : "too short";
  console.log(`[DB DEBUG] Initializing pool with URL length: ${databaseUrl.length}, format: ${obscuredUrl}`);
  if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
    console.warn("[DB DEBUG] WARNING: DATABASE_URL does not start with postgres:// or postgresql://");
  }
}

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

if (!pool && process.env.NODE_ENV === "production") {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

export const db = pool ? drizzle(pool, { schema }) : null as any;

// Verification check for profiles table (essential for auth)
if (pool) {
  pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'profiles'
    );
  `).then(res => {
    if (!res.rows[0].exists) {
      console.error("\n[DB ERROR] 'profiles' table is missing! Auth will fail.");
      console.error("Please run: npm run db:push\n");
    } else {
      console.log("[DB] 'profiles' table verified.");
    }
  }).catch(err => {
    console.error("[DB] Error checking for tables:", err.message);
  });
}

