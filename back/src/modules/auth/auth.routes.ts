import { Router, type Response } from "express";
import type { Environment } from "../../config/env.js";
import type { DatabaseConnection } from "../../database/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authenticate } from "./auth.middleware.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import {
  accessCookieName,
  authCookieOptions,
  refreshCookieMaxAge,
  refreshCookieName,
} from "./auth.tokens.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

function setSessionCookies(response: Response, session: { accessToken: string; refreshToken: string }, environment: Environment) {
  response.cookie(accessCookieName, session.accessToken, authCookieOptions(environment));
  response.cookie(refreshCookieName, session.refreshToken, authCookieOptions(environment, refreshCookieMaxAge(environment)));
}

export function createAuthRouter(database: DatabaseConnection["database"], environment: Environment) {
  const router = Router();
  const repository = createAuthRepository(database);
  const service = createAuthService(repository, environment);
  const requireAuthentication = authenticate(repository, environment);

  router.post("/register", async (request, response) => {
    const session = await service.register(registerSchema.parse(request.body));
    setSessionCookies(response, session, environment);
    response.status(201).json({ data: { user: session.user } });
  });

  router.post("/login", async (request, response) => {
    const session = await service.login(loginSchema.parse(request.body));
    setSessionCookies(response, session, environment);
    response.status(200).json({ data: { user: session.user } });
  });

  router.post("/refresh", async (request, response) => {
    const token = (request.cookies as Record<string, string | undefined>)[refreshCookieName];
    if (!token) throw new AppError(401, "INVALID_SESSION", "نشست کاربری نامعتبر است یا منقضی شده است.");
    const session = await service.refresh(token);
    setSessionCookies(response, session, environment);
    response.status(200).json({ data: { user: session.user } });
  });

  router.post("/logout", async (request, response) => {
    await service.logout((request.cookies as Record<string, string | undefined>)[refreshCookieName]);
    response.clearCookie(accessCookieName, authCookieOptions(environment));
    response.clearCookie(refreshCookieName, authCookieOptions(environment));
    response.status(204).send();
  });

  router.get("/me", requireAuthentication, (request, response) => {
    response.status(200).json({ data: { user: request.authenticatedUser } });
  });

  return router;
}
