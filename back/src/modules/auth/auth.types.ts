import type { InferSelectModel } from "drizzle-orm";
import type { users } from "../../database/schema.js";

export type UserRecord = InferSelectModel<typeof users>;
export type UserRole = UserRecord["role"];

export interface SafeUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: UserRole;
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  };
}

declare global {
  // Express uses declaration merging to expose authenticated request state.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authenticatedUser?: SafeUser;
    }
  }
}
