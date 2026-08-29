import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const requiredText = (max: number) => z.string().trim().min(1).max(max);

export const profileUpdateSchema = z.object({
  firstName: requiredText(80).optional(),
  lastName: requiredText(80).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  profileImageUrl: z.url().max(2048).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "حداقل یکی از اطلاعات پروفایل باید ارسال شود.");

export const salonListQuerySchema = z.object({
  audience: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  search: z.string().trim().max(100).optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

export const salonLookupSchema = z.string().trim().min(1).max(120);

export const adminSalonQuerySchema = z.object({ salonId: z.uuid().optional() }).strict();

export const salonUpdateSchema = z.object({
  name: requiredText(120).optional(),
  description: z.string().trim().max(5000).optional(),
  audience: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  streetAddress: requiredText(300).optional(),
  city: requiredText(120).optional(),
  region: optionalText(120),
  postalCode: optionalText(30),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  phone: optionalText(30),
  email: z.email().toLowerCase().nullable().optional(),
  timezone: requiredText(100).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "حداقل یکی از اطلاعات سالن باید ارسال شود.");

export const salonCreateSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  name: requiredText(120), description: z.string().trim().max(5000).default(""),
  audience: z.enum(["MEN", "WOMEN", "UNISEX"]), streetAddress: requiredText(300),
  city: requiredText(120).default("Not specified"),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/).default("IR"),
  timezone: requiredText(100).default("Asia/Tehran"),
  phone: optionalText(30), email: z.email().toLowerCase().nullable().optional(),
}).strict();
export const adminAssignmentSchema = z.object({ phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/) }).strict();

export const serviceCreateSchema = z.object({
  name: requiredText(120),
  description: z.string().trim().max(2000).default(""),
  durationMinutes: z.number().int().min(5).max(720),
  priceMinor: z.number().int().positive().max(100_000_000).default(1),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).default("IRR"),
}).strict();

export const serviceUpdateSchema = serviceCreateSchema.partial().extend({ isActive: z.boolean().optional() })
  .strict().refine((value) => Object.keys(value).length > 0, "حداقل یکی از اطلاعات خدمت باید ارسال شود.");

export const serviceIdSchema = z.uuid();

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const weeklyScheduleSchema = z.object({
  periods: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: timeSchema,
    closesAt: timeSchema,
  }).strict().refine((period) => period.opensAt < period.closesAt, "زمان شروع باید قبل از زمان پایان باشد.")),
}).strict().superRefine(({ periods }, context) => {
  for (let day = 0; day <= 6; day += 1) {
    const rows = periods.filter((period) => period.dayOfWeek === day).sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index]!.opensAt < rows[index - 1]!.closesAt) context.addIssue({ code: "custom", message: "بازه‌های کاری نباید با یکدیگر هم‌پوشانی داشته باشند.", path: ["periods"] });
    }
  }
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type SalonUpdate = z.infer<typeof salonUpdateSchema>;
export type SalonCreate = z.infer<typeof salonCreateSchema>;
export type ServiceCreate = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
