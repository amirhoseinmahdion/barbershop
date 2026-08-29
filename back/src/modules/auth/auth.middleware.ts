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
      if (!token) throw new AppError(401, "UNAUTHENTICATED", "برای ادامه باید وارد حساب کاربری شوید.");
      const claims = verifyAccessToken(token, environment);
      const user = await repository.findActiveUserById(claims.sub);
      if (!user || user.role !== claims.role) throw new AppError(401, "UNAUTHENTICATED", "برای ادامه باید وارد حساب کاربری شوید.");
      request.authenticatedUser = toSafeUser(user);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorize(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authenticatedUser) return next(new AppError(401, "UNAUTHENTICATED", "برای ادامه باید وارد حساب کاربری شوید."));
    if (!roles.includes(request.authenticatedUser.role)) return next(new AppError(403, "FORBIDDEN", "شما اجازه دسترسی به این بخش را ندارید."));
    next();
  };
}

export function requireSalonAssignment(repository: AuthRepository, parameter = "salonId") {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const user = request.authenticatedUser;
      if (!user) throw new AppError(401, "UNAUTHENTICATED", "برای ادامه باید وارد حساب کاربری شوید.");
      if (user.role === "SUPER_ADMIN") return next();
      const rawSalonId = request.params[parameter];
      const salonId = Array.isArray(rawSalonId) ? rawSalonId[0] : rawSalonId;
      if (!salonId || !(await repository.hasSalonAssignment(user.id, salonId))) {
        throw new AppError(403, "SALON_ACCESS_DENIED", "شما به این سالن اختصاص داده نشده‌اید.");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
