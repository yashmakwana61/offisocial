
import { pool } from "../server/db";

async function run() {
    if (!pool) {
        console.error("No database connection");
        process.exit(1);
    }

    try {
        // Check if linkedin_exchanges table exists
        const checkRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'linkedin_exchanges'
      );
    `);

        if (checkRes.rows[0].exists) {
            console.log("Renaming linkedin_exchanges to chat_requests...");
            await pool.query(`ALTER TABLE linkedin_exchanges RENAME TO chat_requests;`);
            console.log("Table renamed successfully.");
        } else {
            console.log("linkedin_exchanges table not found. Skipping rename.");
        }

        // Also check if chat_requests exists now (it should)
        const checkNew = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_requests'
      );
    `);

        if (checkNew.rows[0].exists) {
            console.log("chat_requests table verified.");
        } else {
            console.error("chat_requests table missing after operations!");
        }

    } catch (err) {
        console.error("Error running manual migration:", err);
    } finally {
        await pool.end();
    }
}

run();
