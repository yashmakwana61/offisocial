import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Checking for profile table columns...");
    try {
        const columns = [
            "hashed_linkedin_id TEXT",
            "extracted_role TEXT",
            "extracted_company TEXT",
            "verification_step TEXT DEFAULT 'oauth_completed'",
            "account_status TEXT DEFAULT 'pending'",
            "status_reason TEXT",
            "linkedin_url_encrypted TEXT",
            "is_linkedin_visible BOOLEAN DEFAULT FALSE",
            "last_verified_at TIMESTAMP DEFAULT NOW()",
            "joined_at TIMESTAMP DEFAULT NOW()",
            "is_exit_mode BOOLEAN DEFAULT FALSE",
            "is_deleted BOOLEAN DEFAULT FALSE",
            "deleted_at TIMESTAMP"
        ];

        for (const col of columns) {
            await db.execute(sql.raw(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${col};`));
        }

        console.log("Successfully ensured all profile columns exist.");
    } catch (err) {
        console.error("Error adding columns:", err);
    }
}

run().catch(console.error);
