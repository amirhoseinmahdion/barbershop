import { and, asc, desc, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import type { DatabaseConnection } from "../../database/client.js";
import { bookings, salonAdmins, salons, services, users, weeklyHours } from "../../database/schema.js";
import type { ProfileUpdate, SalonCreate, SalonUpdate, ServiceCreate, ServiceUpdate, WeeklySchedule } from "./salon.validation.js";

type Database = DatabaseConnection["database"];

export function createSalonRepository(database: Database) {
  return {
    updateProfile: async (userId: string, values: ProfileUpdate) => {
      const [user] = await database.update(users).set({ ...values, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
      return user;
    },
    listPublicSalons: async (query: {
      audience?: "MEN" | "WOMEN" | "UNISEX" | undefined;
      search?: string | undefined;
      cursor?: string | undefined;
      limit: number;
    }) => {
      const filters: SQL[] = [eq(salons.isActive, true)];
      if (query.audience) filters.push(eq(salons.audience, query.audience));
      if (query.search) filters.push(or(ilike(salons.name, `%${query.search}%`), ilike(salons.city, `%${query.search}%`))!);
      if (query.cursor) filters.push(gt(salons.id, query.cursor));
      return database.select().from(salons).where(and(...filters)).orderBy(asc(salons.id)).limit(query.limit + 1);
    },
    findPublicSalon: async (lookup: string) => database.query.salons.findFirst({
      where: and(
        eq(salons.isActive, true),
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup)
          ? eq(salons.id, lookup)
          : eq(salons.slug, lookup),
      ),
    }),
    listPublicServices: async (salonId: string) => database.select().from(services)
      .where(and(eq(services.salonId, salonId), eq(services.isActive, true))).orderBy(asc(services.name)),
    findAssignedSalon: async (userId: string) => {
      const [row] = await database.select({ salon: salons }).from(salonAdmins)
        .innerJoin(salons, eq(salonAdmins.salonId, salons.id)).where(eq(salonAdmins.userId, userId)).limit(1);
      return row?.salon;
    },
    findSalonById: async (salonId: string) => database.query.salons.findFirst({ where: eq(salons.id, salonId) }),
    updateSalon: async (salonId: string, values: SalonUpdate) => {
      const [salon] = await database.update(salons).set({ ...values, updatedAt: new Date() }).where(eq(salons.id, salonId)).returning();
      return salon;
    },
    listAllSalons: async () => {
      const rows = await database
        .select({ salon: salons, admin: { id: users.id, phone: users.phone, firstName: users.firstName, lastName: users.lastName } })
        .from(salons)
        .leftJoin(salonAdmins, eq(salonAdmins.salonId, salons.id))
        .leftJoin(users, eq(users.id, salonAdmins.userId))
        .orderBy(asc(salons.name), asc(users.phone));

      const salonMap = new Map<string, (typeof rows)[number]["salon"] & {
        admins: Array<{ id: string; phone: string; firstName: string; lastName: string }>;
      }>();

      for (const row of rows) {
        const salon = salonMap.get(row.salon.id) ?? { ...row.salon, admins: [] };
        if (row.admin?.id && row.admin.phone && row.admin.firstName && row.admin.lastName) {
          salon.admins.push({
            id: row.admin.id,
            phone: row.admin.phone,
            firstName: row.admin.firstName,
            lastName: row.admin.lastName,
          });
        }
        salonMap.set(row.salon.id, salon);
      }

      return [...salonMap.values()];
    },
    createSalon: async (values: SalonCreate) => {
      const [salon] = await database.insert(salons).values(values).returning(); return salon;
    },
    deleteSalon: async (salonId: string) => {
      const [salon] = await database.delete(salons).where(eq(salons.id, salonId)).returning();
      return salon;
    },
    assignAdminByPhone: async (salonId: string, phone: string) => database.transaction(async (transaction) => {
      const user = await transaction.query.users.findFirst({ where: eq(users.phone, phone) });
      if (!user) return null;
      if (user.role === "CUSTOMER") await transaction.update(users).set({ role: "SALON_ADMIN", updatedAt: new Date() }).where(eq(users.id, user.id));
      if (user.role === "SUPER_ADMIN") return null;
      await transaction.insert(salonAdmins).values({ salonId, userId: user.id }).onConflictDoNothing();
      return { ...user, role: "SALON_ADMIN" as const };
    }),
    listAdminServices: async (salonId: string) => database.select().from(services)
      .where(eq(services.salonId, salonId)).orderBy(asc(services.name)),
    createService: async (salonId: string, values: ServiceCreate) => {
      const [service] = await database.insert(services).values({ salonId, ...values }).returning();
      return service;
    },
    updateService: async (salonId: string, serviceId: string, values: ServiceUpdate) => {
      const [service] = await database.update(services).set({ ...values, updatedAt: new Date() })
        .where(and(eq(services.id, serviceId), eq(services.salonId, salonId))).returning();
      return service;
    },
    deactivateService: async (salonId: string, serviceId: string) => {
      const [service] = await database.update(services).set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(services.id, serviceId), eq(services.salonId, salonId))).returning();
      return service;
    },
    listAdminBookings: async (salonId: string) => database
      .select({
        id: bookings.id,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
        serviceName: bookings.serviceName,
        durationMinutes: bookings.durationMinutes,
        customer: { firstName: users.firstName, lastName: users.lastName, phone: users.phone },
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.customerId))
      .where(eq(bookings.salonId, salonId))
      .orderBy(desc(bookings.startsAt))
      .limit(100),
    listWeeklyHours: async (salonId: string) => database.select().from(weeklyHours)
      .where(eq(weeklyHours.salonId, salonId)).orderBy(asc(weeklyHours.dayOfWeek), asc(weeklyHours.opensAt)),
    replaceWeeklyHours: async (salonId: string, input: WeeklySchedule) => database.transaction(async (transaction) => {
      await transaction.delete(weeklyHours).where(eq(weeklyHours.salonId, salonId));
      if (input.periods.length > 0) await transaction.insert(weeklyHours).values(input.periods.map((period) => ({ salonId, ...period })));
      return transaction.select().from(weeklyHours).where(eq(weeklyHours.salonId, salonId))
        .orderBy(asc(weeklyHours.dayOfWeek), asc(weeklyHours.opensAt));
    }),
  };
}

export type SalonRepository = ReturnType<typeof createSalonRepository>;
