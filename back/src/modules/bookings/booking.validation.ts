import { z } from "zod";
export const availabilityQuerySchema = z.object({ serviceId: z.uuid(), date: z.iso.date() }).strict();
export const bookingCreateSchema = z.object({ salonId: z.uuid(), serviceId: z.uuid(), startsAt: z.iso.datetime() }).strict();
