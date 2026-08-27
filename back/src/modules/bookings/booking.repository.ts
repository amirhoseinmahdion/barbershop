import { and, eq, sql } from "drizzle-orm";
import type { DatabaseConnection } from "../../database/client.js";
import { bookings, salons, services } from "../../database/schema.js";
type Database = DatabaseConnection["database"];

export function createBookingRepository(database: Database) {
  async function slotOptions(salonId: string, serviceId: string, localDate: string) {
    const result = await database.execute(sql`
      with selected as (
        select s.id service_id, s.duration_minutes, sa.timezone
        from services s join salons sa on sa.id=s.salon_id
        where s.id=${serviceId} and s.salon_id=${salonId} and s.is_active=true and sa.is_active=true
      ), periods as (
        select o.opens_at, o.closes_at from schedule_overrides o, selected
        where o.salon_id=${salonId} and o.local_date=${localDate}::date and not o.is_closed
        union all
        select w.opens_at, w.closes_at from weekly_hours w, selected
        where w.salon_id=${salonId} and w.is_active=true and w.day_of_week=extract(dow from ${localDate}::date)
          and not exists (select 1 from schedule_overrides x where x.salon_id=${salonId} and x.local_date=${localDate}::date)
      ), slots as (
        select generate_series(
          (${localDate}::date+p.opens_at) at time zone s.timezone,
          ((${localDate}::date+p.closes_at) at time zone s.timezone) - make_interval(mins=>s.duration_minutes),
          make_interval(mins=>s.duration_minutes)
        ) starts_at, s.duration_minutes from periods p cross join selected s
      ) select starts_at, starts_at > now() and not exists (
        select 1 from bookings b where b.salon_id=${salonId} and b.status in ('PENDING','CONFIRMED')
        and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(slots.starts_at,slots.starts_at+make_interval(mins=>slots.duration_minutes),'[)')
      ) is_available from slots order by starts_at
    `);
    return (result.rows as Array<{ starts_at: Date; is_available: boolean }>).map((row) => ({ startsAt: new Date(row.starts_at).toISOString(), isAvailable: row.is_available }));
  }
  async function availability(salonId: string, serviceId: string, localDate: string) {
    return (await slotOptions(salonId, serviceId, localDate)).filter((slot) => slot.isAvailable).map((slot) => slot.startsAt);
  }
  return {
    availability,
    slotOptions,
    create: async (customerId: string, input: { salonId: string; serviceId: string; startsAt: string }) => database.transaction(async (tx) => {
      const service = await tx.query.services.findFirst({ where: and(eq(services.id, input.serviceId), eq(services.salonId, input.salonId), eq(services.isActive, true)) });
      const salon = await tx.query.salons.findFirst({ where: and(eq(salons.id, input.salonId), eq(salons.isActive, true)) });
      if (!service || !salon) return null;
      const start = new Date(input.startsAt); const end = new Date(start.getTime() + service.durationMinutes * 60_000);
      const [booking] = await tx.insert(bookings).values({ customerId, salonId: input.salonId, serviceId: input.serviceId, startsAt: start, endsAt: end, serviceName: service.name, durationMinutes: service.durationMinutes, priceMinor: service.priceMinor, currency: service.currency }).returning();
      return booking;
    }),
  };
}
