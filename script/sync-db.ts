import { pool } from "../server/db.js";

async function verifySchema() {
    console.log("Checking database schema state...");

    const tables = [
        "companies",
        "profiles",
        "users",
        "posts",
        "comments",
        "reactions",
        "reports",
        "weekly_checkins",
        "linkedin_exchanges",
        "sessions"
    ];

    try {
        const client = await pool.connect();
        try {
            console.log("\nVerifying table existence:");
            const missingTables: string[] = [];

            for (const table of tables) {
                const res = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);

                const exists = res.rows[0].exists;
                if (exists) {
                    console.log(`[OK] ${table}`);
                } else {
                    console.log(`[MISSING] ${table}`);
                    missingTables.push(table);
                }
            }

            if (missingTables.length > 0) {
                console.error(`\nCRITICAL: The following tables are missing: ${missingTables.join(", ")}`);
                console.error("Please run 'npm run db:push' to sync your schema.");
                process.exit(1);
            } else {
                console.log("\nAll tables are present. Database schema is up to date.");
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifySchema();
