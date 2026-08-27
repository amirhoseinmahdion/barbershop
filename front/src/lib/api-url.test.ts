import { afterEach, describe, expect, it } from "vitest";
import { getApiUrl } from "./api-url";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (originalApiUrl === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});

describe("getApiUrl", () => {
  it("joins the configured API base and path without duplicate slashes", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1/";
    expect(getApiUrl("/salons")).toBe("http://localhost:4000/api/v1/salons");
  });

  it("uses the same-origin API proxy for browser requests", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://barbershop-api-pearl.vercel.app/api/v1";
    expect(getApiUrl("auth/login", true)).toBe("/api/v1/auth/login");
  });
});
