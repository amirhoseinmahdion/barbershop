import bcrypt from "bcrypt";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnvironment } from "../src/config/env.js";
import { createDatabase } from "../src/database/client.js";
import { users } from "../src/database/schema.js";
import { authCookieOptions } from "../src/modules/auth/auth.tokens.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeAuth = testDatabaseUrl ? describe : describe.skip;

describeAuth("authentication and role access", () => {
  const environment = loadEnvironment({
    NODE_ENV: "test",
    PORT: "4000",
    FRONTEND_ORIGIN: "http://localhost:3000",
    DATABASE_URL: testDatabaseUrl,
    JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-characters",
    JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-characters",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
    COOKIE_SECURE: "false",
    COOKIE_SAME_SITE: "lax",
  });
  const connection = createDatabase(environment.DATABASE_URL);
  const app = createApp({
    frontendOrigin: environment.FRONTEND_ORIGIN,
    readinessCheck: () => Promise.resolve(),
    database: connection.database,
    environment,
  });

  beforeAll(async () => {
    const databaseName = new URL(environment.DATABASE_URL).pathname.slice(1);
    if (!databaseName.endsWith("_test")) throw new Error("Unsafe test database name.");
    await connection.pool.query("drop schema if exists drizzle cascade");
    await connection.pool.query("drop schema public cascade");
    await connection.pool.query("create schema public");
    await migrate(connection.database, { migrationsFolder: "drizzle" });

    const passwordHash = await bcrypt.hash("Password123!", 4);
    await connection.database.insert(users).values([
      { email: "customer.auth@example.com", passwordHash, firstName: "Customer", lastName: "Auth", role: "CUSTOMER" },
      { email: "admin.auth@example.com", passwordHash, firstName: "Salon", lastName: "Admin", role: "SALON_ADMIN" },
      { email: "super.auth@example.com", passwordHash, firstName: "Super", lastName: "Admin", role: "SUPER_ADMIN" },
      { email: "inactive.auth@example.com", passwordHash, firstName: "Inactive", lastName: "User", isActive: false },
    ]);
  });

  afterAll(async () => connection.pool.end());

  it("registers only a customer and stores a bcrypt hash", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({
        email: "New.Customer@Example.com",
        password: "Password123!",
        firstName: "New",
        lastName: "Customer",
      });

    expect(response.status).toBe(201);
    const body = response.body as { data: { user: Record<string, unknown> } };
    expect(body.data.user).toMatchObject({ email: "new.customer@example.com", role: "CUSTOMER" });
    expect(body.data.user).not.toHaveProperty("passwordHash");
    const cookies = response.headers["set-cookie"] as unknown;
    expect(Array.isArray(cookies) ? cookies.join(";") : String(cookies)).toContain("HttpOnly");

    const saved = await connection.database.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, "new.customer@example.com"),
    });
    expect(saved?.passwordHash).not.toBe("Password123!");
    expect(await bcrypt.compare("Password123!", saved?.passwordHash ?? "")).toBe(true);

    const privileged = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({
        email: "owner@example.com",
        password: "Password123!",
        firstName: "Fake",
        lastName: "Owner",
        role: "SUPER_ADMIN",
      });
    expect(privileged.status).toBe(422);
  });

  it.each([
    ["customer.auth@example.com", "CUSTOMER"],
    ["admin.auth@example.com", "SALON_ADMIN"],
    ["super.auth@example.com", "SUPER_ADMIN"],
  ])("logs in %s with role %s", async (email, role) => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({ email, password: "Password123!" });
    expect(response.status).toBe(200);
    expect((response.body as { data: { user: { role: string } } }).data.user.role).toBe(role);
  });

  it("rejects invalid, inactive, duplicate, and untrusted requests safely", async () => {
    const wrong = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({ email: "customer.auth@example.com", password: "wrong" });
    expect(wrong.status).toBe(401);
    expect((wrong.body as { error: { code: string } }).error.code).toBe("INVALID_CREDENTIALS");

    const inactive = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({ email: "inactive.auth@example.com", password: "Password123!" });
    expect(inactive.status).toBe(401);

    const duplicate = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({ email: "customer.auth@example.com", password: "Password123!", firstName: "Again", lastName: "User" });
    expect(duplicate.status).toBe(409);

    const untrusted = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", "https://attacker.example")
      .send({ email: "customer.auth@example.com", password: "Password123!" });
    expect(untrusted.status).toBe(403);
  });

  it("restores, rotates, logs out, and rejects reused refresh tokens", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post("/api/v1/auth/login")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .send({ email: "customer.auth@example.com", password: "Password123!" });
    const oldRefreshCookie = (login.headers["set-cookie"] as unknown as string[]).find((cookie) => cookie.startsWith("salon_refresh="));
    expect(oldRefreshCookie).toBeDefined();

    expect((await agent.get("/api/v1/auth/me")).status).toBe(200);
    const refresh = await agent.post("/api/v1/auth/refresh").set("Origin", environment.FRONTEND_ORIGIN);
    expect(refresh.status).toBe(200);

    const reuse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", environment.FRONTEND_ORIGIN)
      .set("Cookie", oldRefreshCookie ?? "");
    expect(reuse.status).toBe(401);

    expect((await agent.post("/api/v1/auth/logout").set("Origin", environment.FRONTEND_ORIGIN)).status).toBe(204);
    expect((await agent.get("/api/v1/auth/me")).status).toBe(401);
  });

  it("uses secure cookie flags for production settings", () => {
    const options = authCookieOptions({ ...environment, NODE_ENV: "production", COOKIE_SECURE: true, COOKIE_SAME_SITE: "strict" });
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/" });
  });
});
