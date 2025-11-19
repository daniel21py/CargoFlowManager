import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, "ufficio"))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(users).values({
      username: "ufficio",
      password: "password123",
    });
    console.log("✅ Default user created (username: ufficio, password: password123)");
  } else {
    console.log("ℹ️  Default user already exists");
  }

  console.log("✅ Database seeded successfully!");
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
