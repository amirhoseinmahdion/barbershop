import { Router } from "express";
import type { Environment } from "../../config/env.js";
import type { DatabaseConnection } from "../../database/client.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { createAuthRepository } from "../auth/auth.repository.js";
import { toSafeUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createSalonRepository, type SalonRepository } from "./salon.repository.js";
import {
  adminSalonQuerySchema, profileUpdateSchema, salonListQuerySchema, salonLookupSchema,
  salonUpdateSchema, serviceCreateSchema, serviceIdSchema, serviceUpdateSchema,
} from "./salon.validation.js";

type Database = DatabaseConnection["database"];

async function resolveManagedSalon(repository: SalonRepository, user: NonNullable<Express.Request["authenticatedUser"]>, query: unknown) {
  const { salonId } = adminSalonQuerySchema.parse(query);
  if (user.role === "SUPER_ADMIN") {
    if (!salonId) throw new AppError(422, "SALON_ID_REQUIRED", "A salonId is required for platform administration.");
    const salon = await repository.findSalonById(salonId);
    if (!salon) throw new AppError(404, "SALON_NOT_FOUND", "The salon was not found.");
    return salon;
  }
  if (salonId) throw new AppError(403, "SALON_ACCESS_DENIED", "Salon administrators cannot select another salon.");
  const salon = await repository.findAssignedSalon(user.id);
  if (!salon) throw new AppError(403, "SALON_ACCESS_DENIED", "You are not assigned to a salon.");
  return salon;
}

export function createProfileRouter(database: Database, environment: Environment) {
  const router = Router();
  const authRepository = createAuthRepository(database);
  const repository = createSalonRepository(database);
  router.patch("/me", authenticate(authRepository, environment), async (request, response) => {
    const updated = await repository.updateProfile(request.authenticatedUser!.id, profileUpdateSchema.parse(request.body));
    if (!updated) throw new AppError(404, "USER_NOT_FOUND", "The user was not found.");
    response.json({ data: { user: toSafeUser(updated) } });
  });
  return router;
}

export function createPublicSalonRouter(database: Database) {
  const router = Router();
  const repository = createSalonRepository(database);
  router.get("/", async (request, response) => {
    const query = salonListQuerySchema.parse(request.query);
    const rows = await repository.listPublicSalons(query);
    const hasMore = rows.length > query.limit;
    const data = rows.slice(0, query.limit);
    response.json({ data, nextCursor: hasMore ? data.at(-1)?.id ?? null : null });
  });
  router.get("/:salonIdOrSlug", async (request, response) => {
    const salon = await repository.findPublicSalon(salonLookupSchema.parse(request.params.salonIdOrSlug));
    if (!salon) throw new AppError(404, "SALON_NOT_FOUND", "The salon was not found.");
    response.json({ data: { salon } });
  });
  router.get("/:salonId/services", async (request, response) => {
    const salonId = serviceIdSchema.parse(request.params.salonId);
    const salon = await repository.findSalonById(salonId);
    if (!salon?.isActive) throw new AppError(404, "SALON_NOT_FOUND", "The salon was not found.");
    response.json({ data: await repository.listPublicServices(salonId), nextCursor: null });
  });
  return router;
}

export function createAdminSalonRouter(database: Database, environment: Environment) {
  const router = Router();
  const authRepository = createAuthRepository(database);
  const repository = createSalonRepository(database);
  router.use(authenticate(authRepository, environment), authorize("SALON_ADMIN", "SUPER_ADMIN"));

  router.get("/salon", async (request, response) => {
    response.json({ data: { salon: await resolveManagedSalon(repository, request.authenticatedUser!, request.query) } });
  });
  router.patch("/salon", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.json({ data: { salon: await repository.updateSalon(salon.id, salonUpdateSchema.parse(request.body)) } });
  });
  router.get("/services", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.json({ data: await repository.listAdminServices(salon.id), nextCursor: null });
  });
  router.post("/services", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.status(201).json({ data: { service: await repository.createService(salon.id, serviceCreateSchema.parse(request.body)) } });
  });
  router.patch("/services/:serviceId", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    const service = await repository.updateService(salon.id, serviceIdSchema.parse(request.params.serviceId), serviceUpdateSchema.parse(request.body));
    if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "The service was not found.");
    response.json({ data: { service } });
  });
  router.delete("/services/:serviceId", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    const service = await repository.deactivateService(salon.id, serviceIdSchema.parse(request.params.serviceId));
    if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "The service was not found.");
    response.status(204).send();
  });
  return router;
}
