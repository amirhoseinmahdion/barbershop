import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "SALON_ADMIN", "SUPER_ADMIN"]);
export const salonAudienceEnum = pgEnum("salon_audience", ["MEN", "WOMEN", "UNISEX"]);
export const newsStatusEnum = pgEnum("news_status", ["DRAFT", "PUBLISHED"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    profileImageUrl: text("profile_image_url"),
    role: userRoleEnum("role").default("CUSTOMER").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check("users_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
    check("users_email_not_blank_check", sql`length(trim(${table.email})) > 0`),
    check("users_first_name_not_blank_check", sql`length(trim(${table.firstName})) > 0`),
    check("users_last_name_not_blank_check", sql`length(trim(${table.lastName})) > 0`),
  ],
);

export const salons = pgTable(
  "salons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    audience: salonAudienceEnum("audience").notNull(),
    streetAddress: text("street_address").notNull(),
    city: text("city").notNull(),
    region: text("region"),
    postalCode: text("postal_code"),
    countryCode: char("country_code", { length: 2 }).notNull(),
    phone: text("phone"),
    email: text("email"),
    timezone: text("timezone").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("salons_slug_unique").on(table.slug),
    index("salons_audience_active_idx").on(table.audience, table.isActive),
    check("salons_slug_format_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("salons_name_not_blank_check", sql`length(trim(${table.name})) > 0`),
    check("salons_timezone_not_blank_check", sql`length(trim(${table.timezone})) > 0`),
    check("salons_country_code_uppercase_check", sql`${table.countryCode} ~ '^[A-Z]{2}$'`),
  ],
);

export const salonAdmins = pgTable(
  "salon_admins",
  {
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ name: "salon_admins_pk", columns: [table.salonId, table.userId] }),
    index("salon_admins_user_idx").on(table.userId),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("services_id_salon_unique").on(table.id, table.salonId),
    uniqueIndex("services_salon_name_unique").on(table.salonId, table.name),
    index("services_salon_active_idx").on(table.salonId, table.isActive),
    check("services_name_not_blank_check", sql`length(trim(${table.name})) > 0`),
    check("services_duration_positive_check", sql`${table.durationMinutes} > 0`),
    check("services_price_positive_check", sql`${table.priceMinor} > 0`),
    check("services_currency_uppercase_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export const weeklyHours = pgTable(
  "weekly_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    opensAt: time("opens_at").notNull(),
    closesAt: time("closes_at").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("weekly_hours_period_unique").on(table.salonId, table.dayOfWeek, table.opensAt),
    index("weekly_hours_salon_day_idx").on(table.salonId, table.dayOfWeek),
    check("weekly_hours_day_check", sql`${table.dayOfWeek} between 0 and 6`),
    check("weekly_hours_interval_check", sql`${table.opensAt} < ${table.closesAt}`),
  ],
);

export const scheduleOverrides = pgTable(
  "schedule_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    localDate: date("local_date", { mode: "string" }).notNull(),
    opensAt: time("opens_at"),
    closesAt: time("closes_at"),
    isClosed: boolean("is_closed").default(false).notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("schedule_overrides_period_unique").on(table.salonId, table.localDate, table.opensAt),
    index("schedule_overrides_salon_date_idx").on(table.salonId, table.localDate),
    check(
      "schedule_overrides_shape_check",
      sql`(${table.isClosed} and ${table.opensAt} is null and ${table.closesAt} is null) or
          (not ${table.isClosed} and ${table.opensAt} is not null and ${table.closesAt} is not null and ${table.opensAt} < ${table.closesAt})`,
    ),
  ],
);

export const newsPosts = pgTable(
  "news_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").default("").notNull(),
    content: text("content").notNull(),
    coverImageUrl: text("cover_image_url"),
    status: newsStatusEnum("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("news_posts_salon_slug_unique").on(table.salonId, table.slug).where(sql`${table.salonId} is not null`),
    uniqueIndex("news_posts_platform_slug_unique").on(table.slug).where(sql`${table.salonId} is null`),
    index("news_posts_status_published_idx").on(table.status, table.publishedAt.desc()),
    index("news_posts_salon_published_idx").on(table.salonId, table.publishedAt.desc()),
    check("news_posts_title_not_blank_check", sql`length(trim(${table.title})) > 0`),
    check("news_posts_slug_format_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("news_posts_published_at_check", sql`${table.status} = 'DRAFT' or ${table.publishedAt} is not null`),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").default("CONFIRMED").notNull(),
    serviceName: text("service_name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    customerNote: text("customer_note"),
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "bookings_service_salon_fk",
      columns: [table.serviceId, table.salonId],
      foreignColumns: [services.id, services.salonId],
    }).onDelete("restrict"),
    index("bookings_salon_starts_idx").on(table.salonId, table.startsAt),
    index("bookings_customer_starts_idx").on(table.customerId, table.startsAt.desc()),
    check("bookings_interval_check", sql`${table.startsAt} < ${table.endsAt}`),
    check("bookings_duration_positive_check", sql`${table.durationMinutes} > 0`),
    check("bookings_price_positive_check", sql`${table.priceMinor} > 0`),
    check("bookings_currency_uppercase_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      "bookings_cancellation_check",
      sql`(${table.status} = 'CANCELLED' and ${table.cancelledAt} is not null) or
          (${table.status} <> 'CANCELLED' and ${table.cancelledAt} is null)`,
    ),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("auth_sessions_refresh_token_hash_unique").on(table.refreshTokenHash),
    index("auth_sessions_user_expires_idx").on(table.userId, table.expiresAt),
    check("auth_sessions_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
  ],
);
