import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadEnvironment } from "../config/env.js";
import { createDatabase } from "./client.js";

const environment = loadEnvironment();
const { database, pool } = createDatabase(environment.DATABASE_URL);

try {
  await migrate(database, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied successfully.");
} finally {
  await pool.end();
}

