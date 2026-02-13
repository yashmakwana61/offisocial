
import { pool } from "../server/db";

async function run() {
  if (!pool) {
    console.error("No database connection");
    process.exit(1);
  }

  try {
    console.log("Truncating chat_requests table...");
    await pool.query(`TRUNCATE TABLE chat_requests CASCADE;`);
    console.log("Table truncated successfully.");
  } catch (err) {
    console.error("Error truncating table:", err);
  } finally {
    await pool.end();
  }
}

run();
