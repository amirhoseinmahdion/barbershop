import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { authorize, requireSalonAssignment } from "../src/modules/auth/auth.middleware.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import type { SafeUser } from "../src/modules/auth/auth.types.js";
import { AppError } from "../src/shared/errors/app-error.js";

const customer: SafeUser = {
  id: "00000000-0000-4000-8000-000000000001", email: "customer@example.com", firstName: "Test", lastName: "Customer",
  phone: "+17770000001", profileImageUrl: null, role: "CUSTOMER",
};
const salonAdmin: SafeUser = { ...customer, id: "00000000-0000-4000-8000-000000000002", role: "SALON_ADMIN" };
const superAdmin: SafeUser = { ...customer, id: "00000000-0000-4000-8000-000000000003", role: "SUPER_ADMIN" };

function requestFor(user?: SafeUser, salonId = "salon-one") {
  return { authenticatedUser: user, params: { salonId } } as unknown as Request;
}

describe("role and salon authorization middleware", () => {
  it("allows only configured roles", () => {
    const next = vi.fn() as NextFunction;
    authorize("SALON_ADMIN")(requestFor(salonAdmin), {} as Response, next);
    expect(next).toHaveBeenCalledWith();

    const rejected = vi.fn() as NextFunction;
    authorize("SALON_ADMIN")(requestFor(customer), {} as Response, rejected);
    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({ status: 403, code: "FORBIDDEN" }));
  });

  it("requires authentication before role checks", () => {
    const next = vi.fn() as NextFunction;
    authorize("CUSTOMER")(requestFor(), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: "UNAUTHENTICATED" }));
  });

  it("scopes salon admins to assignments and permits platform admins", async () => {
    const repository = { hasSalonAssignment: vi.fn().mockResolvedValue(false) } as unknown as AuthRepository;
    const rejected = vi.fn() as NextFunction;
    await requireSalonAssignment(repository)(requestFor(salonAdmin), {} as Response, rejected);
    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({ status: 403, code: "SALON_ACCESS_DENIED" }));

    const allowed = vi.fn() as NextFunction;
    await requireSalonAssignment(repository)(requestFor(superAdmin), {} as Response, allowed);
    expect(allowed).toHaveBeenCalledWith();
    expect(repository.hasSalonAssignment).toHaveBeenCalledTimes(1);
  });

  it("surfaces authorization failures as application errors", () => {
    const error = new AppError(403, "FORBIDDEN", "Forbidden");
    expect(error).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});
