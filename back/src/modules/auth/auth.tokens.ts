import { createHash, randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Environment } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { SafeUser, UserRole } from "./auth.types.js";

export const accessCookieName = "salon_access";
export const refreshCookieName = "salon_refresh";

interface AccessClaims extends JwtPayload {
  sub: string;
  role: UserRole;
  type: "access";
}

interface RefreshClaims extends JwtPayload {
  sub: string;
  sid: string;
  type: "refresh";
}

function durationToMilliseconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error("Invalid token duration.");
  const value = Number(match[1]);
  const multiplier = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
  return value * multiplier;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionTokens(user: SafeUser, sessionId: string, environment: Environment) {
  const accessToken = jwt.sign(
    { role: user.role, type: "access" },
    environment.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: environment.JWT_ACCESS_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]> },
  );
  const refreshToken = jwt.sign(
    { sid: sessionId, type: "refresh", nonce: randomUUID() },
    environment.JWT_REFRESH_SECRET,
    { subject: user.id, expiresIn: environment.JWT_REFRESH_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]> },
  );

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: new Date(Date.now() + durationToMilliseconds(environment.JWT_REFRESH_EXPIRES_IN)),
  };
}

export function verifyAccessToken(token: string, environment: Environment): AccessClaims {
  try {
    const claims = jwt.verify(token, environment.JWT_ACCESS_SECRET);
    if (typeof claims === "string" || claims.type !== "access" || !claims.sub || !claims.role) throw new Error();
    return claims as AccessClaims;
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "برای ادامه باید وارد حساب کاربری شوید.");
  }
}

export function verifyRefreshToken(token: string, environment: Environment): RefreshClaims {
  try {
    const claims = jwt.verify(token, environment.JWT_REFRESH_SECRET);
    if (typeof claims === "string" || claims.type !== "refresh" || !claims.sub || !claims.sid) throw new Error();
    return claims as RefreshClaims;
  } catch {
    throw new AppError(401, "INVALID_SESSION", "نشست کاربری نامعتبر است یا منقضی شده است.");
  }
}

export function authCookieOptions(environment: Environment, maxAge?: number) {
  return {
    httpOnly: true,
    secure: environment.COOKIE_SECURE,
    sameSite: environment.COOKIE_SAME_SITE,
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  } as const;
}

export function refreshCookieMaxAge(environment: Environment): number {
  return durationToMilliseconds(environment.JWT_REFRESH_EXPIRES_IN);
}
