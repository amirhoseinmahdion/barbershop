import { and, eq, gt, isNull } from "drizzle-orm";
import type { DatabaseConnection } from "../../database/client.js";
import { authSessions, salonAdmins, users } from "../../database/schema.js";

type Database = DatabaseConnection["database"];

export function createAuthRepository(database: Database) {
  return {
    findUserByEmail: async (email: string) => database.query.users.findFirst({ where: eq(users.email, email) }),
    findUserByPhone: async (phone: string) => database.query.users.findFirst({ where: eq(users.phone, phone) }),
    findActiveUserById: async (id: string) =>
      database.query.users.findFirst({ where: and(eq(users.id, id), eq(users.isActive, true)) }),
    createCustomer: async (values: typeof users.$inferInsert) => {
      const [user] = await database.insert(users).values(values).returning();
      return user;
    },
    createSession: async (values: typeof authSessions.$inferInsert) => {
      await database.insert(authSessions).values(values);
    },
    findValidSession: async (id: string, userId: string) =>
      database.query.authSessions.findFirst({
        where: and(
          eq(authSessions.id, id),
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      }),
    rotateSession: async (id: string, previousHash: string, nextHash: string, expiresAt: Date) => {
      const rows = await database
        .update(authSessions)
        .set({ refreshTokenHash: nextHash, expiresAt, lastUsedAt: new Date() })
        .where(and(eq(authSessions.id, id), eq(authSessions.refreshTokenHash, previousHash), isNull(authSessions.revokedAt)))
        .returning({ id: authSessions.id });
      return rows.length === 1;
    },
    revokeSession: async (id: string, tokenHash: string) => {
      await database
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(authSessions.id, id), eq(authSessions.refreshTokenHash, tokenHash), isNull(authSessions.revokedAt)));
    },
    hasSalonAssignment: async (userId: string, salonId: string) =>
      Boolean(
        await database.query.salonAdmins.findFirst({
          where: and(eq(salonAdmins.userId, userId), eq(salonAdmins.salonId, salonId)),
        }),
      ),
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
