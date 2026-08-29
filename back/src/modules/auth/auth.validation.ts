import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phone = z.string().trim().regex(/^\+?[0-9]{7,15}$/, "شماره تلفن باید بین ۷ تا ۱۵ رقم باشد و می‌تواند با + شروع شود.");
const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد.")
  .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.")
  .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد.");

export const registerSchema = z
  .object({
    email: z.union([email, z.literal("").transform(() => undefined)]).optional(),
    password,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone,
  })
  .strict();

export const loginSchema = z
  .object({
    phone,
    password: z.string().min(1).max(72),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
