import { describe, expect, it } from "vitest";
import { destinationForRole, localizedAuthErrorMessage } from "./auth";

describe("destinationForRole", () => {
  it.each([
    ["CUSTOMER", "/account"],
    ["SALON_ADMIN", "/admin"],
    ["SUPER_ADMIN", "/platform"],
  ] as const)("maps %s to its protected area", (role, destination) => {
    expect(destinationForRole(role)).toBe(destination);
  });
});

describe("localizedAuthErrorMessage", () => {
  it.each([
    ["PHONE_ALREADY_EXISTS", "An account with this phone number already exists.", "حسابی با این شماره تلفن از قبل وجود دارد."],
    ["INVALID_CREDENTIALS", "Phone number or password is incorrect.", "شماره تلفن یا رمز عبور اشتباه است."],
  ])("localizes %s even when an old API returns English", (code, message, expected) => {
    expect(localizedAuthErrorMessage({ error: { code, message } })).toBe(expected);
  });

  it("does not expose an unknown English server message", () => {
    expect(localizedAuthErrorMessage({ error: { message: "Unknown server error" } }))
      .toBe("درخواست انجام نشد. لطفاً دوباره تلاش کنید.");
  });
});
