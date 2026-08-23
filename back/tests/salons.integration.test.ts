import bcrypt from "bcrypt";
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnvironment } from "../src/config/env.js";
import { createDatabase } from "../src/database/client.js";
import { bookings, salonAdmins, salons, services, users, weeklyHours } from "../src/database/schema.js";

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
      { email: "customer.manage@example.com", phone: "+16660000001", passwordHash, firstName: "Manage", lastName: "Customer", role: "CUSTOMER" },
      { email: "assigned.manage@example.com", phone: "+16660000002", passwordHash, firstName: "Assigned", lastName: "Admin", role: "SALON_ADMIN" },
      { email: "unassigned.manage@example.com", phone: "+16660000003", passwordHash, firstName: "Unassigned", lastName: "Admin", role: "SALON_ADMIN" },
      { email: "platform.manage@example.com", phone: "+16660000004", passwordHash, firstName: "Platform", lastName: "Admin", role: "SUPER_ADMIN" },
    ]).returning();
    const assignedAdmin = createdUsers.find((user) => user.email?.startsWith("assigned."))!;
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
    await connection.database.insert(weeklyHours).values({ salonId: salonOneId, dayOfWeek: 6, opensAt: "09:00:00", closesAt: "12:00:00" });
  });

  afterAll(async () => connection.pool.end());

  async function login(phone: string) {
    const agent = request.agent(app);
    const response = await agent.post("/api/v1/auth/login").set("Origin", environment.FRONTEND_ORIGIN).send({ phone, password: "Password123!" });
    expect(response.status).toBe(200);
    return agent;
  }

  it("updates only allowed personal profile fields", async () => {
    const agent = await login("+16660000001");
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
    const agent = await login("+16660000002");
    const read = await agent.get("/api/v1/admin/salon");
    expect(read.body.data.salon.id).toBe(salonOneId);
    const updated = await agent.patch("/api/v1/admin/salon").set("Origin", environment.FRONTEND_ORIGIN).send({ description: "Updated profile" });
    expect(updated.body.data.salon.description).toBe("Updated profile");
    const selectedOther = await agent.patch(`/api/v1/admin/salon?salonId=${salonTwoId}`).set("Origin", environment.FRONTEND_ORIGIN).send({ name: "Hijacked" });
    expect(selectedOther.status).toBe(403);
  });

  it("denies customers and unassigned administrators", async () => {
    const customer = await login("+989120000000");
    expect((await customer.get("/api/v1/admin/salon")).status).toBe(403);
    const unassigned = await login("+16660000003");
    expect((await unassigned.get("/api/v1/admin/salon")).status).toBe(403);
  });

  it("creates, updates, and deactivates assigned salon services", async () => {
    const agent = await login("+16660000002");
    const created = await agent.post("/api/v1/admin/services").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ name: "Color", description: "Full color", durationMinutes: 60 });
    expect(created.status).toBe(201);
    expect(created.body.data.service).toMatchObject({ priceMinor: 1, currency: "IRR" });
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
    const agent = await login("+16660000002");
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
    const agent = await login("+16660000004");
    expect((await agent.get("/api/v1/admin/salon")).status).toBe(422);
    const response = await agent.patch(`/api/v1/admin/salon?salonId=${salonTwoId}`).set("Origin", environment.FRONTEND_ORIGIN).send({ city: "Isfahan" });
    expect(response.status).toBe(200);
    expect(response.body.data.salon).toMatchObject({ id: salonTwoId, city: "Isfahan" });
  });

  it("lets platform admins create salons and assign an administrator", async () => {
    const agent = await login("+16660000004");
    const created = await agent.post("/api/v1/platform/salons").set("Origin", environment.FRONTEND_ORIGIN).send({
      slug: "platform-created", name: "Platform Created", audience: "UNISEX", streetAddress: "10 New Street",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.salon).toMatchObject({ city: "Not specified", countryCode: "IR", timezone: "Asia/Tehran" });
    const salonId = created.body.data.salon.id as string;
    const assigned = await agent.post(`/api/v1/platform/salons/${salonId}/admins`).set("Origin", environment.FRONTEND_ORIGIN)
      .send({ phone: "+16660000003" });
    expect(assigned.status).toBe(201);
    expect(assigned.body.data.user.role).toBe("SALON_ADMIN");
    const list = await agent.get("/api/v1/platform/salons");
    expect(list.body.data.find((salon: { id: string }) => salon.id === salonId)).toMatchObject({
      admins: [{ phone: "+16660000003", firstName: "Unassigned", lastName: "Admin" }],
    });
  });

  it("lets only platform admins delete a salon without booking history", async () => {
    const platformAdmin = await login("+16660000004");
    const created = await platformAdmin.post("/api/v1/platform/salons").set("Origin", environment.FRONTEND_ORIGIN).send({
      slug: "delete-me", name: "Delete Me", audience: "UNISEX", streetAddress: "11 New Street",
    });
    const salonId = created.body.data.salon.id as string;

    const salonAdmin = await login("+16660000002");
    expect((await salonAdmin.delete(`/api/v1/platform/salons/${salonId}`).set("Origin", environment.FRONTEND_ORIGIN)).status).toBe(403);
    expect((await platformAdmin.delete(`/api/v1/platform/salons/${salonId}`).set("Origin", environment.FRONTEND_ORIGIN)).status).toBe(204);
    expect(await connection.database.query.salons.findFirst({ where: eq(salons.id, salonId) })).toBeUndefined();
    expect((await platformAdmin.delete(`/api/v1/platform/salons/${salonId}`).set("Origin", environment.FRONTEND_ORIGIN)).status).toBe(404);
  });

  it("lets customers reserve a backend-calculated salon service time", async () => {
    const availability = await request(app).get(`/api/v1/salons/${salonOneId}/availability?serviceId=${otherServiceId}&date=2030-01-05`);
    expect(availability.status).toBe(200);
    // The service belongs to another salon, so cross-salon availability is empty.
    expect(availability.body.data.slots).toEqual([]);
    const ownService = await connection.database.query.services.findFirst({ where: (table, { and, eq }) => and(eq(table.salonId, salonOneId), eq(table.name, "Active Cut")) });
    const slots = await request(app).get(`/api/v1/salons/${salonOneId}/availability?serviceId=${ownService!.id}&date=2030-01-05`);
    expect(slots.body.data.slots.length).toBeGreaterThan(0);
    expect(new Date(slots.body.data.slots[1]).getTime() - new Date(slots.body.data.slots[0]).getTime()).toBe(15 * 60 * 1000);
    const customer = await login("+989120000000");
    const created = await customer.post("/api/v1/bookings").set("Origin", environment.FRONTEND_ORIGIN)
      .send({ salonId: salonOneId, serviceId: ownService!.id, startsAt: slots.body.data.slots[0] });
    expect(created.status).toBe(201);
    expect(await connection.database.query.bookings.findFirst({ where: eq(bookings.id, created.body.data.booking.id) })).toBeDefined();
    const refreshedSlots = await request(app).get(`/api/v1/salons/${salonOneId}/availability?serviceId=${ownService!.id}&date=2030-01-05`);
    expect(refreshedSlots.body.data.slots).not.toContain(slots.body.data.slots[0]);
    const admin = await login("+16660000002");
    const adminBookings = await admin.get("/api/v1/admin/bookings");
    expect(adminBookings.status).toBe(200);
    expect(adminBookings.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: created.body.data.booking.id, serviceName: "Active Cut", customer: expect.objectContaining({ phone: "+989120000000" }) }),
    ]));
    expect((await admin.get(`/api/v1/admin/bookings?salonId=${salonTwoId}`)).status).toBe(403);
    expect((await admin.post("/api/v1/bookings").set("Origin", environment.FRONTEND_ORIGIN).send({ salonId: salonOneId, serviceId: ownService!.id, startsAt: slots.body.data.slots[1] })).status).toBe(403);
  });
});
