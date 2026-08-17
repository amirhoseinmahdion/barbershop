import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phone = z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number using 7 to 15 digits.");
const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

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
