import { pool } from "../server/db";
import { sql } from "drizzle-orm";

async function clearDatabase() {
    console.log("Starting database clearing process...");

    const tables = [
        "reactions",
        "reports",
        "comments",
        "posts",
        "weekly_checkins",
        "linkedin_exchanges",
        "profiles",
        "users",
        "companies",
        "sessions"
    ];

    try {
        const client = await pool.connect();
        try {
            // Using TRUNCATE with CASCADE to handle foreign keys and RESTART IDENTITY to reset IDs
            const query = `TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE;`;
            console.log(`Executing: ${query}`);
            await client.query(query);
            console.log("Successfully cleared all data from the database.");

            console.log("\nVerifying data removal:");
            for (const table of tables) {
                const res = await client.query(`SELECT count(*) FROM ${table}`);
                const count = res.rows[0].count;
                console.log(`${table}: ${count} rows`);
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

clearDatabase();
