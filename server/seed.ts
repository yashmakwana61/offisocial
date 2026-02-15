import { db } from "./db.js";
import { companies, posts, profiles } from "../shared/schema.js";

export async function seedDatabase() {
  try {
    const existingCompanies = await db.select().from(companies);
    if (existingCompanies.length === 0) {
      console.log("Seeding companies...");
      await db.insert(companies).values([
        { name: "Acme Corp", domain: "acme.com" },
        { name: "TechStart", domain: "techstart.io" },
        { name: "Global Dynamics", domain: "global.com" },
      ]);
    } else {
      console.log("Companies already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
