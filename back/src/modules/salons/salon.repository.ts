import { and, asc, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import type { DatabaseConnection } from "../../database/client.js";
import { salonAdmins, salons, services, users } from "../../database/schema.js";
import type { ProfileUpdate, SalonUpdate, ServiceCreate, ServiceUpdate } from "./salon.validation.js";

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
  };
}

export type SalonRepository = ReturnType<typeof createSalonRepository>;
