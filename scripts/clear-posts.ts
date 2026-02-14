import { pool } from "../server/db.js";

async function clearPosts() {
    if (!pool) {
        console.error("No database connection");
        process.exit(1);
    }

    try {
        console.log("🧹 Clearing posts, comments, reactions, and reports...");
        // Cascade handle deletion of comments/reactions when posts are truncated
        await pool.query(`TRUNCATE TABLE reactions, comments, reports, posts RESTART IDENTITY CASCADE;`);
        console.log("✅ Posts data cleared successfully.");
    } catch (err) {
        console.error("❌ Error clearing data:", err);
    } finally {
        await pool.end();
    }
}

clearPosts();
