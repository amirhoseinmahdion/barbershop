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
