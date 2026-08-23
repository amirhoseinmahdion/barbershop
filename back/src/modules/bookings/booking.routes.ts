import { Router } from "express";
import { eq } from "drizzle-orm";
import type { Environment } from "../../config/env.js";
import type { DatabaseConnection } from "../../database/client.js";
import { salons } from "../../database/schema.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { createAuthRepository } from "../auth/auth.repository.js";
import { createBookingRepository } from "./booking.repository.js";
import { availabilityQuerySchema, bookingCreateSchema } from "./booking.validation.js";
type Database = DatabaseConnection["database"];
export function createBookingRouter(database: Database, environment: Environment) {
  const router=Router(); const repository=createBookingRepository(database); const auth=createAuthRepository(database);
  router.post("/", authenticate(auth,environment), authorize("CUSTOMER"), async (request,response)=>{
    const input=bookingCreateSchema.parse(request.body);
    const [salon] = await database.select().from(salons).where(eq(salons.id, input.salonId)).limit(1);
    if (!salon) throw new AppError(404,"SALON_NOT_FOUND","The salon was not found.");
    const localDate=new Intl.DateTimeFormat("en-CA",{timeZone:salon.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(input.startsAt));
    const slots=await repository.availability(input.salonId,input.serviceId,localDate);
    if (!slots.includes(new Date(input.startsAt).toISOString())) throw new AppError(409,"TIME_UNAVAILABLE","This time is no longer available.");
    const booking=await repository.create(request.authenticatedUser!.id,input);
    if (!booking) throw new AppError(422,"INVALID_SERVICE","The salon or service is unavailable.");
    response.status(201).json({data:{booking}});
  }); return router;
}
export function createAvailabilityRouter(database: Database) {
  const router=Router(); const repository=createBookingRepository(database);
  router.get("/:salonId/availability",async(request,response)=>{
    const salonId=bookingCreateSchema.shape.salonId.parse(request.params.salonId); const query=availabilityQuerySchema.parse(request.query);
    response.json({data:{slots:await repository.availability(salonId,query.serviceId,query.date)}});
  }); return router;
}
