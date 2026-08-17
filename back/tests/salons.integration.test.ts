import bcrypt from "bcrypt";
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnvironment } from "../src/config/env.js";
import { createDatabase } from "../src/database/client.js";
import { salonAdmins, salons, services, users } from "../src/database/schema.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeSalons = testDatabaseUrl ? describe : describe.skip;

describeSalons("profiles and salon management", () => {
  const environment = loadEnvironment({
    NODE_ENV: "test", PORT: "4000", FRONTEND_ORIGIN: "http://localhost:3000", DATABASE_URL: testDatabaseUrl,
    JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-characters",
    JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-characters",
    JWT_ACCESS_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d", COOKIE_SECURE: "false", COOKIE_SAME_SITE: "lax",
  });
  const connection = createDatabase(environment.DATABASE_URL);
  const app = createApp({ frontendOrigin: environment.FRONTEND_ORIGIN, readinessCheck: () => Promise.resolve(), database: connection.database, environment });
  let salonOneId = "";
  let salonTwoId = "";
  let inactiveSalonId = "";
  let otherServiceId = "";

  beforeAll(async () => {
    const databaseName = new URL(environment.DATABASE_URL).pathname.slice(1);
    if (!databaseName.endsWith("_test")) throw new Error("Unsafe test database name.");
    await connection.pool.query("drop schema if exists drizzle cascade");
    await connection.pool.query("drop schema public cascade");
    await connection.pool.query("create schema public");
    await migrate(connection.database, { migrationsFolder: "drizzle" });
    const passwordHash = await bcrypt.hash("Password123!", 4);
    const createdUsers = await connection.database.insert(users).values([
      { email: "customer.manage@example.com", passwordHash, firstName: "Manage", lastName: "Customer", role: "CUSTOMER" },
      { email: "assigned.manage@example.com", passwordHash, firstName: "Assigned", lastName: "Admin", role: "SALON_ADMIN" },
      { email: "unassigned.manage@example.com", passwordHash, firstName: "Unassigned", lastName: "Admin", role: "SALON_ADMIN" },
      { email: "platform.manage@example.com", passwordHash, firstName: "Platform", lastName: "Admin", role: "SUPER_ADMIN" },
    ]).returning();
    const assignedAdmin = createdUsers.find((user) => user.email.startsWith("assigned."))!;
    const createdSalons = await connection.database.insert(salons).values([
      { slug: "first-salon", name: "First Salon", audience: "UNISEX", streetAddress: "1 Main St", city: "Tehran", countryCode: "IR", timezone: "Asia/Tehran" },
      { slug: "second-salon", name: "Second Salon", audience: "MEN", streetAddress: "2 Main St", city: "Shiraz", countryCode: "IR", timezone: "Asia/Tehran" },
      { slug: "inactive-salon", name: "Inactive Salon", audience: "WOMEN", streetAddress: "3 Main St", city: "Tabriz", countryCode: "IR", timezone: "Asia/Tehran", isActive: false },
    ]).returning();
    salonOneId = createdSalons[0]!.id;
    salonTwoId = createdSalons[1]!.id;
    inactiveSalonId = createdSalons[2]!.id;
    await connection.database.insert(salonAdmins).values({ salonId: salonOneId, userId: assignedAdmin.id });
    const createdServices = await connection.database.insert(services).values([
      { salonId: salonOneId, name: "Active Cut", durationMinutes: 30, priceMinor: 2500, currency: "USD" },
      { salonId: salonOneId, name: "Hidden Cut", durationMinutes: 45, priceMinor: 3500, currency: "USD", isActive: false },
      { salonId: salonTwoId, name: "Other Cut", durationMinutes: 30, priceMinor: 2000, currency: "USD" },
    ]).returning();
    otherServiceId = createdServices[2]!.id;
  });

  afterAll(async () => connection.pool.end());

  async function login(email: string) {
    const agent = request.agent(app);
    const response = await agent.post("/api/v1/auth/login").set("Origin", environment.FRONTEND_ORIGIN).send({ email, password: "Password123!" });
    expect(response.status).toBe(200);
    return agent;
  }

  it("updates only allowed personal profile fields", async () => {
    const agent = await login("customer.manage@example.com");
    const updated = await agent.patch("/api/v1/users/me").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ firstName: "Updated", phone: "+989120000000" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user).toMatchObject({ firstName: "Updated", phone: "+989120000000", role: "CUSTOMER" });
    expect(updated.body.data.user).not.toHaveProperty("passwordHash");
    const forbidden = await agent.patch("/api/v1/users/me").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ role: "SUPER_ADMIN", isActive: false, email: "stolen@example.com" });
    expect(forbidden.status).toBe(422);
    const saved = await connection.database.query.users.findFirst({ where: eq(users.email, "customer.manage@example.com") });
    expect(saved).toMatchObject({ firstName: "Updated", role: "CUSTOMER", isActive: true });
  });

  it("lists only active salons and active public services", async () => {
    const list = await request(app).get("/api/v1/salons?audience=UNISEX&search=First");
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].slug).toBe("first-salon");
    expect((await request(app).get("/api/v1/salons/inactive-salon")).status).toBe(404);
    expect((await request(app).get(`/api/v1/salons/${inactiveSalonId}/services`)).status).toBe(404);
    const publicServices = await request(app).get(`/api/v1/salons/${salonOneId}/services`);
    expect(publicServices.body.data.map((service: { name: string }) => service.name)).toEqual(["Active Cut"]);
  });

  it("lets an assigned admin update only their salon", async () => {
    const agent = await login("assigned.manage@example.com");
    const read = await agent.get("/api/v1/admin/salon");
    expect(read.body.data.salon.id).toBe(salonOneId);
    const updated = await agent.patch("/api/v1/admin/salon").set("Origin", environment.FRONTEND_ORIGIN).send({ description: "Updated profile" });
    expect(updated.body.data.salon.description).toBe("Updated profile");
    const selectedOther = await agent.patch(`/api/v1/admin/salon?salonId=${salonTwoId}`).set("Origin", environment.FRONTEND_ORIGIN).send({ name: "Hijacked" });
    expect(selectedOther.status).toBe(403);
  });

  it("denies customers and unassigned administrators", async () => {
    const customer = await login("customer.manage@example.com");
    expect((await customer.get("/api/v1/admin/salon")).status).toBe(403);
    const unassigned = await login("unassigned.manage@example.com");
    expect((await unassigned.get("/api/v1/admin/salon")).status).toBe(403);
  });

  it("creates, updates, and deactivates assigned salon services", async () => {
    const agent = await login("assigned.manage@example.com");
    const created = await agent.post("/api/v1/admin/services").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ name: "Color", description: "Full color", durationMinutes: 60, priceMinor: 5000, currency: "USD" });
    expect(created.status).toBe(201);
    const serviceId = created.body.data.service.id as string;
    const updated = await agent.patch(`/api/v1/admin/services/${serviceId}`).set("Origin", environment.FRONTEND_ORIGIN)
      .send({ durationMinutes: 75, isActive: true });
    expect(updated.body.data.service.durationMinutes).toBe(75);
    expect((await agent.delete(`/api/v1/admin/services/${serviceId}`).set("Origin", environment.FRONTEND_ORIGIN)).status).toBe(204);
    const saved = await connection.database.query.services.findFirst({ where: eq(services.id, serviceId) });
    expect(saved?.isActive).toBe(false);
    expect((await agent.patch(`/api/v1/admin/services/${otherServiceId}`).set("Origin", environment.FRONTEND_ORIGIN).send({ name: "Nope" })).status).toBe(404);
  });

  it("validates service rules and uniqueness safely", async () => {
    const agent = await login("assigned.manage@example.com");
    for (const body of [
      { name: "Bad", durationMinutes: 0, priceMinor: 100, currency: "USD" },
      { name: "Bad", durationMinutes: 30, priceMinor: 0, currency: "USD" },
      { name: "Bad", durationMinutes: 30, priceMinor: 100, currency: "usd" },
    ]) {
      expect((await agent.post("/api/v1/admin/services").set("Origin", environment.FRONTEND_ORIGIN).send(body)).status).toBe(422);
    }
    const duplicate = await agent.post("/api/v1/admin/services").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ name: "Active Cut", durationMinutes: 30, priceMinor: 2500, currency: "USD" });
    expect(duplicate.status).toBe(409);
    expect((await agent.patch("/api/v1/admin/services/not-a-uuid").set("Origin", environment.FRONTEND_ORIGIN).send({ name: "Bad" })).status).toBe(422);
  });

  it("permits explicit platform-admin cross-salon management", async () => {
    const agent = await login("platform.manage@example.com");
    expect((await agent.get("/api/v1/admin/salon")).status).toBe(422);
    const response = await agent.patch(`/api/v1/admin/salon?salonId=${salonTwoId}`).set("Origin", environment.FRONTEND_ORIGIN).send({ city: "Isfahan" });
    expect(response.status).toBe(200);
    expect(response.body.data.salon).toMatchObject({ id: salonTwoId, city: "Isfahan" });
  });
});
