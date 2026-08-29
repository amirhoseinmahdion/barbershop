import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("health endpoints", () => {
  it("reports process liveness", async () => {
    const app = createApp({ frontendOrigin: "http://localhost:3000", readinessCheck: () => Promise.resolve() });
    const response = await request(app).get("/health/live");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("reports unavailable dependencies", async () => {
    const app = createApp({
      frontendOrigin: "http://localhost:3000",
      readinessCheck: async () => Promise.reject(new Error("offline")),
    });
    const response = await request(app).get("/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "not_ready", database: "unavailable" });
  });
});

describe("CORS", () => {
  const app = createApp({ frontendOrigin: "http://localhost:3000", readinessCheck: () => Promise.resolve() });

  it("allows the configured frontend", async () => {
    const response = await request(app).get("/health/live").set("Origin", "http://localhost:3000");
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not grant another origin", async () => {
    const response = await request(app).get("/health/live").set("Origin", "https://example.com");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("API documentation", () => {
  const app = createApp({ frontendOrigin: "http://localhost:3000", readinessCheck: () => Promise.resolve() });

  it("serves the OpenAPI document", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      openapi: "3.1.0",
      info: { title: "Hair Salon Platform API" },
      paths: {
        "/health/live": {},
        "/health/ready": {},
        "/api/v1/auth/register": {},
        "/api/v1/auth/login": {},
        "/api/v1/auth/refresh": {},
        "/api/v1/auth/logout": {},
        "/api/v1/auth/me": {},
        "/api/v1/users/me": {},
        "/api/v1/salons": {},
        "/api/v1/salons/{salonIdOrSlug}": {},
        "/api/v1/salons/{salonId}/services": {},
        "/api/v1/salons/{salonId}/availability": {},
        "/api/v1/bookings": {},
        "/api/v1/admin/salon": {},
        "/api/v1/admin/services": {},
        "/api/v1/admin/services/{serviceId}": {},
        "/api/v1/admin/bookings": {},
        "/api/v1/admin/schedule/weekly": {},
        "/api/v1/platform/salons": {},
        "/api/v1/platform/salons/{salonId}": {},
        "/api/v1/platform/salons/{salonId}/admins": {},
      },
    });
  });

  it("serves Swagger UI", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Hair Salon Platform API");
  });
});

describe("client-facing errors", () => {
  it("returns Persian text for unknown routes", async () => {
    const app = createApp({ frontendOrigin: "http://localhost:3000", readinessCheck: () => Promise.resolve() });
    const response = await request(app).get("/missing-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "منبع درخواستی پیدا نشد.",
      },
    });
  });
});
