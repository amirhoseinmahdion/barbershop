import type { NextFunction, Request, Response } from "express";
import type { Environment } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthRepository } from "./auth.repository.js";
import { accessCookieName, verifyAccessToken } from "./auth.tokens.js";
import { toSafeUser, type UserRole } from "./auth.types.js";

export function authenticate(repository: AuthRepository, environment: Environment) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const token = request.cookies[accessCookieName] as string | undefined;
      if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
      const claims = verifyAccessToken(token, environment);
      const user = await repository.findActiveUserById(claims.sub);
      if (!user || user.role !== claims.role) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
      request.authenticatedUser = toSafeUser(user);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorize(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authenticatedUser) return next(new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
    if (!roles.includes(request.authenticatedUser.role)) return next(new AppError(403, "FORBIDDEN", "You do not have access to this resource."));
    next();
  };
}

export function requireSalonAssignment(repository: AuthRepository, parameter = "salonId") {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const user = request.authenticatedUser;
      if (!user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
      if (user.role === "SUPER_ADMIN") return next();
      const rawSalonId = request.params[parameter];
      const salonId = Array.isArray(rawSalonId) ? rawSalonId[0] : rawSalonId;
      if (!salonId || !(await repository.hasSalonAssignment(user.id, salonId))) {
        throw new AppError(403, "SALON_ACCESS_DENIED", "You are not assigned to this salon.");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
