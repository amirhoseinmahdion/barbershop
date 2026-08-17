import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const database = drizzle({ client: pool });

  return { database, pool };
}

export type DatabaseConnection = ReturnType<typeof createDatabase>;

