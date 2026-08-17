import { loadEnvironment } from "../config/env.js";
import { createDatabase, type DatabaseConnection } from "./client.js";
import {
  bookings,
  newsPosts,
  salonAdmins,
  salons,
  scheduleOverrides,
  services,
  users,
  weeklyHours,
} from "./schema.js";

export const seedIds = {
  customer: "10000000-0000-4000-8000-000000000001",
  salonAdmin: "10000000-0000-4000-8000-000000000002",
  superAdmin: "10000000-0000-4000-8000-000000000003",
  salon: "20000000-0000-4000-8000-000000000001",
  service: "30000000-0000-4000-8000-000000000001",
  secondService: "30000000-0000-4000-8000-000000000002",
  weeklyMorning: "40000000-0000-4000-8000-000000000001",
  weeklyAfternoon: "40000000-0000-4000-8000-000000000002",
  override: "50000000-0000-4000-8000-000000000001",
  news: "60000000-0000-4000-8000-000000000001",
  booking: "70000000-0000-4000-8000-000000000001",
} as const;

// Password: Password123! — local development accounts only.
const developmentPasswordHash = "$2b$12$Aoiy5l.QfT7Wlt2xi2jcgO8MxixSx3xI9lyRiX/HV.Ks8gPwF4Wli";

export async function seedDatabase({ database }: Pick<DatabaseConnection, "database">): Promise<void> {
  await database.transaction(async (transaction) => {
    await transaction
      .insert(users)
      .values([
        {
          id: seedIds.customer,
          email: "customer@example.com",
          passwordHash: developmentPasswordHash,
          firstName: "Demo",
          lastName: "Customer",
          role: "CUSTOMER",
        },
        {
          id: seedIds.salonAdmin,
          email: "salon.admin@example.com",
          passwordHash: developmentPasswordHash,
          firstName: "Demo",
          lastName: "Salon Admin",
          role: "SALON_ADMIN",
        },
        {
          id: seedIds.superAdmin,
          email: "platform.admin@example.com",
          passwordHash: developmentPasswordHash,
          firstName: "Demo",
          lastName: "Platform Admin",
          role: "SUPER_ADMIN",
        },
      ])
      .onConflictDoUpdate({
        target: users.id,
        set: { passwordHash: developmentPasswordHash, updatedAt: new Date() },
      });

    await transaction
      .insert(salons)
      .values({
        id: seedIds.salon,
        slug: "demo-salon",
        name: "Demo Salon",
        description: "Development-only salon data.",
        audience: "UNISEX",
        streetAddress: "100 Example Street",
        city: "Tehran",
        countryCode: "IR",
        phone: "+980000000000",
        email: "salon@example.com",
        timezone: "Asia/Tehran",
      })
      .onConflictDoNothing();

    await transaction
      .insert(salonAdmins)
      .values({ salonId: seedIds.salon, userId: seedIds.salonAdmin })
      .onConflictDoNothing();

    await transaction
      .insert(services)
      .values([
        {
          id: seedIds.service,
          salonId: seedIds.salon,
          name: "Classic Haircut",
          description: "Consultation, haircut, and finish.",
          durationMinutes: 45,
          priceMinor: 500_000,
          currency: "IRR",
        },
        {
          id: seedIds.secondService,
          salonId: seedIds.salon,
          name: "Hair Styling",
          description: "Wash and professional styling.",
          durationMinutes: 60,
          priceMinor: 750_000,
          currency: "IRR",
        },
      ])
      .onConflictDoNothing();

    await transaction
      .insert(weeklyHours)
      .values([
        {
          id: seedIds.weeklyMorning,
          salonId: seedIds.salon,
          dayOfWeek: 6,
          opensAt: "09:00:00",
          closesAt: "12:00:00",
        },
        {
          id: seedIds.weeklyAfternoon,
          salonId: seedIds.salon,
          dayOfWeek: 6,
          opensAt: "13:00:00",
          closesAt: "18:00:00",
        },
      ])
      .onConflictDoNothing();

    await transaction
      .insert(scheduleOverrides)
      .values({
        id: seedIds.override,
        salonId: seedIds.salon,
        localDate: "2030-01-01",
        isClosed: true,
        reason: "Development example holiday",
      })
      .onConflictDoNothing();

    await transaction
      .insert(newsPosts)
      .values({
        id: seedIds.news,
        salonId: seedIds.salon,
        authorId: seedIds.salonAdmin,
        title: "Welcome to Demo Salon",
        slug: "welcome-to-demo-salon",
        excerpt: "A development-only published news example.",
        content: "This content exists only to verify the local database seed.",
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-17T09:00:00.000Z"),
      })
      .onConflictDoNothing();

    await transaction
      .insert(bookings)
      .values({
        id: seedIds.booking,
        salonId: seedIds.salon,
        serviceId: seedIds.service,
        customerId: seedIds.customer,
        startsAt: new Date("2030-01-05T06:00:00.000Z"),
        endsAt: new Date("2030-01-05T06:45:00.000Z"),
        status: "CONFIRMED",
        serviceName: "Classic Haircut",
        durationMinutes: 45,
        priceMinor: 500_000,
        currency: "IRR",
      })
      .onConflictDoNothing();
  });
}

async function runSeed(): Promise<void> {
  const environment = loadEnvironment();
  const connection = createDatabase(environment.DATABASE_URL);

  try {
    await seedDatabase(connection);
    console.log("Development seed applied successfully.");
  } finally {
    await connection.pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runSeed();
}
