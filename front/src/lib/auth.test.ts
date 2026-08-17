import { describe, expect, it } from "vitest";
import { destinationForRole } from "./auth";

describe("destinationForRole", () => {
  it.each([
    ["CUSTOMER", "/account"],
    ["SALON_ADMIN", "/admin"],
    ["SUPER_ADMIN", "/platform"],
  ] as const)("maps %s to its protected area", (role, destination) => {
    expect(destinationForRole(role)).toBe(destination);
  });
});
