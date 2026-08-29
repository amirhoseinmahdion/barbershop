import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { Environment } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthRepository } from "./auth.repository.js";
import {
  createSessionTokens,
  hashRefreshToken,
  verifyRefreshToken,
} from "./auth.tokens.js";
import { toSafeUser } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

export function createAuthService(repository: AuthRepository, environment: Environment) {
  async function issueSession(user: ReturnType<typeof toSafeUser>) {
    const sessionId = randomUUID();
    const tokens = createSessionTokens(user, sessionId, environment);
    await repository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: tokens.refreshExpiresAt,
    });
    return { user, ...tokens };
  }

  return {
    register: async (input: RegisterInput) => {
      if (input.email && await repository.findUserByEmail(input.email)) {
        throw new AppError(409, "EMAIL_ALREADY_EXISTS", "حسابی با این ایمیل از قبل وجود دارد.");
      }
      if (await repository.findUserByPhone(input.phone)) {
        throw new AppError(409, "PHONE_ALREADY_EXISTS", "حسابی با این شماره تلفن از قبل وجود دارد.");
      }
      const user = await repository.createCustomer({
        email: input.email ?? null,
        passwordHash: await bcrypt.hash(input.password, 12),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: "CUSTOMER",
      });
      if (!user) throw new AppError(500, "ACCOUNT_CREATE_FAILED", "ساخت حساب کاربری انجام نشد.");
      return issueSession(toSafeUser(user));
    },
    login: async (input: LoginInput) => {
      const user = await repository.findUserByPhone(input.phone);
      if (!user || !user.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new AppError(401, "INVALID_CREDENTIALS", "تلفن همراه یا رمز عبور اشتباه است.");
      }
      return issueSession(toSafeUser(user));
    },
    refresh: async (rawRefreshToken: string) => {
      const claims = verifyRefreshToken(rawRefreshToken, environment);
      const session = await repository.findValidSession(claims.sid, claims.sub);
      if (!session || session.refreshTokenHash !== hashRefreshToken(rawRefreshToken)) {
        throw new AppError(401, "INVALID_SESSION", "نشست کاربری نامعتبر است یا منقضی شده است.");
      }
      const userRecord = await repository.findActiveUserById(claims.sub);
      if (!userRecord) throw new AppError(401, "INVALID_SESSION", "نشست کاربری نامعتبر است یا منقضی شده است.");
      const user = toSafeUser(userRecord);
      const tokens = createSessionTokens(user, claims.sid, environment);
      const rotated = await repository.rotateSession(
        claims.sid,
        hashRefreshToken(rawRefreshToken),
        hashRefreshToken(tokens.refreshToken),
        tokens.refreshExpiresAt,
      );
      if (!rotated) throw new AppError(401, "INVALID_SESSION", "نشست کاربری قبلاً نوسازی شده است.");
      return { user, ...tokens };
    },
    logout: async (rawRefreshToken: string | undefined) => {
      if (!rawRefreshToken) return;
      try {
        const claims = verifyRefreshToken(rawRefreshToken, environment);
        await repository.revokeSession(claims.sid, hashRefreshToken(rawRefreshToken));
      } catch {
        // Cookies are cleared even when a stale token cannot be verified.
      }
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
