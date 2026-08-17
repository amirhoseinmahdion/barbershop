import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../src/database/client.js";
import { seedDatabase, seedIds } from "../src/database/seed.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = testDatabaseUrl ? describe : describe.skip;

function requireSafeTestDatabaseUrl(): string {
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for database integration tests.");
  }

  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    throw new Error("Refusing to reset a database whose name does not end with '_test'.");
  }

  return testDatabaseUrl;
}

function getDatabaseErrorCode(reason: unknown): string | undefined {
  if (typeof reason !== "object" || reason === null || !("code" in reason)) {
    return undefined;
  }

  const code = (reason as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

describeDatabase("database foundation", () => {
  let pool: Pool;

  beforeAll(async () => {
    const connection = createDatabase(requireSafeTestDatabaseUrl());
    pool = connection.pool;

    await pool.query("drop schema if exists drizzle cascade");
    await pool.query("drop schema public cascade");
    await pool.query("create schema public");
    await migrate(connection.database, { migrationsFolder: "drizzle" });
    await seedDatabase(connection);
    await seedDatabase(connection);
  }, 30_000);

  afterAll(async () => {
    await pool.end();
  });

  it("migrates and seeds every domain area idempotently", async () => {
    const result = await pool.query<{
      users: number;
      salons: number;
      services: number;
      weekly_hours: number;
      overrides: number;
      news: number;
      bookings: number;
    }>(`
      select
        (select count(*)::int from users) as users,
        (select count(*)::int from salons) as salons,
        (select count(*)::int from services) as services,
        (select count(*)::int from weekly_hours) as weekly_hours,
        (select count(*)::int from schedule_overrides) as overrides,
        (select count(*)::int from news_posts) as news,
        (select count(*)::int from bookings) as bookings
    `);

    expect(result.rows[0]).toEqual({
      users: 3,
      salons: 1,
      services: 2,
      weekly_hours: 2,
      overrides: 1,
      news: 1,
      bookings: 1,
    });
  });

  it("rejects invalid enum, ownership, value, schedule, and foreign-key data", async () => {
    await expect(
      pool.query(
        "insert into users (email, password_hash, first_name, last_name, role) values ($1, $2, $3, $4, $5)",
        ["invalid-role@example.com", "not-a-real-hash", "Invalid", "Role", "OWNER"],
      ),
    ).rejects.toMatchObject({ code: "22P02" });

    await expect(
      pool.query(
        "insert into users (email, password_hash, first_name, last_name) values ($1, $2, $3, $4)",
        ["Uppercase@example.com", "not-a-real-hash", "Invalid", "Email"],
      ),
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      pool.query(
        `insert into services
          (salon_id, name, duration_minutes, price_minor, currency)
         values ($1, $2, $3, $4, $5)`,
        [seedIds.salon, "Invalid price", 30, 0, "IRR"],
      ),
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      pool.query(
        `insert into weekly_hours
          (salon_id, day_of_week, opens_at, closes_at)
         values ($1, 6, '10:00', '11:00')`,
        [seedIds.salon],
      ),
    ).rejects.toMatchObject({ code: "23P01" });

    await expect(
      pool.query(
        `insert into schedule_overrides
          (salon_id, local_date, opens_at, closes_at, is_closed)
         values ($1, '2030-01-01', '10:00', '11:00', false)`,
        [seedIds.salon],
      ),
    ).rejects.toMatchObject({ code: "23P01" });

    await expect(
      pool.query(
        `insert into salon_admins (salon_id, user_id)
         values ($1, $2)`,
        [seedIds.salon, randomUUID()],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("allows only one of two concurrent overlapping active bookings", async () => {
    const startsAt = "2030-02-02T09:00:00.000Z";
    const endsAt = "2030-02-02T09:45:00.000Z";

    const insertBooking = (id: string) =>
      pool.query(
        `insert into bookings
          (id, salon_id, service_id, customer_id, starts_at, ends_at, status,
           service_name, duration_minutes, price_minor, currency)
         values ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7, 45, 500000, 'IRR')`,
        [
          id,
          seedIds.salon,
          seedIds.service,
          seedIds.customer,
          startsAt,
          endsAt,
          "Classic Haircut",
        ],
      );

    const results = await Promise.allSettled([insertBooking(randomUUID()), insertBooking(randomUUID())]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(["23P01", "40P01"]).toContain(getDatabaseErrorCode(rejected[0]?.reason));

    const persisted = await pool.query<{ count: number }>(
      "select count(*)::int as count from bookings where starts_at = $1",
      [startsAt],
    );
    expect(persisted.rows[0]?.count).toBe(1);
  });

  it("allows a confirmed booking to replace a cancelled interval", async () => {
    const startsAt = "2030-03-03T10:00:00.000Z";
    const endsAt = "2030-03-03T10:45:00.000Z";
    const values = [
      seedIds.salon,
      seedIds.service,
      seedIds.customer,
      startsAt,
      endsAt,
      "Classic Haircut",
    ];

    await pool.query(
      `insert into bookings
        (salon_id, service_id, customer_id, starts_at, ends_at, status,
         service_name, duration_minutes, price_minor, currency, cancelled_at)
       values ($1, $2, $3, $4, $5, 'CANCELLED', $6, 45, 500000, 'IRR', now())`,
      values,
    );

    await expect(
      pool.query(
        `insert into bookings
          (salon_id, service_id, customer_id, starts_at, ends_at, status,
           service_name, duration_minutes, price_minor, currency)
         values ($1, $2, $3, $4, $5, 'CONFIRMED', $6, 45, 500000, 'IRR')`,
        values,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it("rejects a booking whose service belongs to a different salon", async () => {
    const secondSalonId = randomUUID();
    await pool.query(
      `insert into salons
        (id, slug, name, audience, street_address, city, country_code, timezone)
       values ($1, $2, $3, 'UNISEX', $4, $5, 'IR', 'Asia/Tehran')`,
      [secondSalonId, `second-${secondSalonId}`, "Second Salon", "200 Example Street", "Tehran"],
    );

    await expect(
      pool.query(
        `insert into bookings
          (salon_id, service_id, customer_id, starts_at, ends_at,
           service_name, duration_minutes, price_minor, currency)
         values ($1, $2, $3, '2030-04-04T10:00:00Z', '2030-04-04T10:45:00Z',
                 'Classic Haircut', 45, 500000, 'IRR')`,
        [secondSalonId, seedIds.service, seedIds.customer],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
});
