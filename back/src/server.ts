import { sql } from "drizzle-orm";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";
import { createDatabase } from "./database/client.js";

const environment = loadEnvironment();
const { database, pool } = createDatabase(environment.DATABASE_URL);

const app = createApp({
  frontendOrigin: environment.FRONTEND_ORIGIN,
  database,
  environment,
  readinessCheck: async () => {
    await database.execute(sql`select 1`);
  },
});

const server = app.listen(environment.PORT, () => {
  console.log(`API listening on http://localhost:${environment.PORT}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received; shutting down.`);
  server.close((error) => {
    void pool
      .end()
      .then(() => process.exit(error ? 1 : 0))
      .catch(() => process.exit(1));
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
