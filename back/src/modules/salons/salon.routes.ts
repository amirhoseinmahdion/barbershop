import { Router } from "express";
import type { Environment } from "../../config/env.js";
import type { DatabaseConnection } from "../../database/client.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { createAuthRepository } from "../auth/auth.repository.js";
import { toSafeUser } from "../auth/auth.types.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createSalonRepository, type SalonRepository } from "./salon.repository.js";
import {
  adminAssignmentSchema, adminSalonQuerySchema, profileUpdateSchema, salonCreateSchema, salonListQuerySchema, salonLookupSchema,
  salonUpdateSchema, serviceCreateSchema, serviceIdSchema, serviceUpdateSchema,
  weeklyScheduleSchema,
} from "./salon.validation.js";

type Database = DatabaseConnection["database"];

async function resolveManagedSalon(repository: SalonRepository, user: NonNullable<Express.Request["authenticatedUser"]>, query: unknown) {
  const { salonId } = adminSalonQuerySchema.parse(query);
  if (user.role === "SUPER_ADMIN") {
    if (!salonId) throw new AppError(422, "SALON_ID_REQUIRED", "شناسه سالن برای مدیریت پلتفرم الزامی است.");
    const salon = await repository.findSalonById(salonId);
    if (!salon) throw new AppError(404, "SALON_NOT_FOUND", "سالن پیدا نشد.");
    return salon;
  }
  if (salonId) throw new AppError(403, "SALON_ACCESS_DENIED", "مدیر سالن نمی‌تواند سالن دیگری را انتخاب کند.");
  const salon = await repository.findAssignedSalon(user.id);
  if (!salon) throw new AppError(403, "SALON_ACCESS_DENIED", "هیچ سالنی به شما اختصاص داده نشده است.");
  return salon;
}

export function createPlatformSalonRouter(database: Database, environment: Environment) {
  const router = Router();
  const authRepository = createAuthRepository(database); const repository = createSalonRepository(database);
  router.use(authenticate(authRepository, environment), authorize("SUPER_ADMIN"));
  router.get("/salons", async (_request, response) => response.json({ data: await repository.listAllSalons(), nextCursor: null }));
  router.post("/salons", async (request, response) => response.status(201).json({ data: { salon: await repository.createSalon(salonCreateSchema.parse(request.body)) } }));
  router.delete("/salons/:salonId", async (request, response) => {
    const salonId = serviceIdSchema.parse(request.params.salonId);
    try {
      const salon = await repository.deleteSalon(salonId);
      if (!salon) throw new AppError(404, "SALON_NOT_FOUND", "سالن پیدا نشد.");
      response.status(204).send();
    } catch (error) {
      const databaseError = error as { code?: string; cause?: { code?: string } };
      if ((databaseError.code ?? databaseError.cause?.code) === "23503") {
        throw new AppError(409, "SALON_HAS_BOOKINGS", "سالنی که سابقه رزرو دارد قابل حذف نیست.");
      }
      throw error;
    }
  });
  router.post("/salons/:salonId/admins", async (request, response) => {
    const salonId = serviceIdSchema.parse(request.params.salonId);
    if (!await repository.findSalonById(salonId)) throw new AppError(404, "SALON_NOT_FOUND", "سالن پیدا نشد.");
    const user = await repository.assignAdminByPhone(salonId, adminAssignmentSchema.parse(request.body).phone);
    if (!user) throw new AppError(404, "ELIGIBLE_ADMIN_NOT_FOUND", "کاربر واجد شرایطی با این شماره تلفن پیدا نشد.");
    response.status(201).json({ data: { user: toSafeUser(user) } });
  });
  return router;
}

export function createProfileRouter(database: Database, environment: Environment) {
  const router = Router();
  const authRepository = createAuthRepository(database);
  const repository = createSalonRepository(database);
  router.patch("/me", authenticate(authRepository, environment), async (request, response) => {
    const updated = await repository.updateProfile(request.authenticatedUser!.id, profileUpdateSchema.parse(request.body));
    if (!updated) throw new AppError(404, "USER_NOT_FOUND", "کاربر پیدا نشد.");
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
    if (!salon) throw new AppError(404, "SALON_NOT_FOUND", "سالن پیدا نشد.");
    response.json({ data: { salon } });
  });
  router.get("/:salonId/services", async (request, response) => {
    const salonId = serviceIdSchema.parse(request.params.salonId);
    const salon = await repository.findSalonById(salonId);
    if (!salon?.isActive) throw new AppError(404, "SALON_NOT_FOUND", "سالن پیدا نشد.");
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
  router.get("/bookings", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.json({ data: await repository.listAdminBookings(salon.id), nextCursor: null });
  });
  router.get("/schedule/weekly", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.json({ data: { periods: await repository.listWeeklyHours(salon.id) } });
  });
  router.put("/schedule/weekly", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.json({ data: { periods: await repository.replaceWeeklyHours(salon.id, weeklyScheduleSchema.parse(request.body)) } });
  });
  router.post("/services", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    response.status(201).json({ data: { service: await repository.createService(salon.id, serviceCreateSchema.parse(request.body)) } });
  });
  router.patch("/services/:serviceId", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    const service = await repository.updateService(salon.id, serviceIdSchema.parse(request.params.serviceId), serviceUpdateSchema.parse(request.body));
    if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "خدمت پیدا نشد.");
    response.json({ data: { service } });
  });
  router.delete("/services/:serviceId", async (request, response) => {
    const salon = await resolveManagedSalon(repository, request.authenticatedUser!, request.query);
    const service = await repository.deactivateService(salon.id, serviceIdSchema.parse(request.params.serviceId));
    if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "خدمت پیدا نشد.");
    response.status(204).send();
  });
  return router;
}
