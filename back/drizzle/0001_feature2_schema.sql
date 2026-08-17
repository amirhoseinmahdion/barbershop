CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."news_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."salon_audience" AS ENUM('MEN', 'WOMEN', 'UNISEX');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER', 'SALON_ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_expiry_check" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'CONFIRMED' NOT NULL,
	"service_name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"customer_note" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_interval_check" CHECK ("bookings"."starts_at" < "bookings"."ends_at"),
	CONSTRAINT "bookings_duration_positive_check" CHECK ("bookings"."duration_minutes" > 0),
	CONSTRAINT "bookings_price_positive_check" CHECK ("bookings"."price_minor" > 0),
	CONSTRAINT "bookings_currency_uppercase_check" CHECK ("bookings"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "bookings_cancellation_check" CHECK (("bookings"."status" = 'CANCELLED' and "bookings"."cancelled_at" is not null) or
          ("bookings"."status" <> 'CANCELLED' and "bookings"."cancelled_at" is null))
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"cover_image_url" text,
	"status" "news_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_posts_title_not_blank_check" CHECK (length(trim("news_posts"."title")) > 0),
	CONSTRAINT "news_posts_slug_format_check" CHECK ("news_posts"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "news_posts_published_at_check" CHECK ("news_posts"."status" = 'DRAFT' or "news_posts"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "salon_admins" (
	"salon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salon_admins_pk" PRIMARY KEY("salon_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "salons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"audience" "salon_audience" NOT NULL,
	"street_address" text NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"postal_code" text,
	"country_code" char(2) NOT NULL,
	"phone" text,
	"email" text,
	"timezone" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salons_slug_format_check" CHECK ("salons"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "salons_name_not_blank_check" CHECK (length(trim("salons"."name")) > 0),
	CONSTRAINT "salons_timezone_not_blank_check" CHECK (length(trim("salons"."timezone")) > 0),
	CONSTRAINT "salons_country_code_uppercase_check" CHECK ("salons"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "schedule_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"opens_at" time,
	"closes_at" time,
	"is_closed" boolean DEFAULT false NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_overrides_shape_check" CHECK (("schedule_overrides"."is_closed" and "schedule_overrides"."opens_at" is null and "schedule_overrides"."closes_at" is null) or
          (not "schedule_overrides"."is_closed" and "schedule_overrides"."opens_at" is not null and "schedule_overrides"."closes_at" is not null and "schedule_overrides"."opens_at" < "schedule_overrides"."closes_at"))
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_id_salon_unique" UNIQUE("id","salon_id"),
	CONSTRAINT "services_name_not_blank_check" CHECK (length(trim("services"."name")) > 0),
	CONSTRAINT "services_duration_positive_check" CHECK ("services"."duration_minutes" > 0),
	CONSTRAINT "services_price_positive_check" CHECK ("services"."price_minor" > 0),
	CONSTRAINT "services_currency_uppercase_check" CHECK ("services"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"profile_image_url" text,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lowercase_check" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_email_not_blank_check" CHECK (length(trim("users"."email")) > 0),
	CONSTRAINT "users_first_name_not_blank_check" CHECK (length(trim("users"."first_name")) > 0),
	CONSTRAINT "users_last_name_not_blank_check" CHECK (length(trim("users"."last_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "weekly_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_hours_day_check" CHECK ("weekly_hours"."day_of_week" between 0 and 6),
	CONSTRAINT "weekly_hours_interval_check" CHECK ("weekly_hours"."opens_at" < "weekly_hours"."closes_at")
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_admins" ADD CONSTRAINT "salon_admins_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_admins" ADD CONSTRAINT "salon_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_overrides" ADD CONSTRAINT "schedule_overrides_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_hours" ADD CONSTRAINT "weekly_hours_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_unique" ON "auth_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_expires_idx" ON "auth_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "bookings_salon_starts_idx" ON "bookings" USING btree ("salon_id","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_customer_starts_idx" ON "bookings" USING btree ("customer_id","starts_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "news_posts_salon_slug_unique" ON "news_posts" USING btree ("salon_id","slug") WHERE "news_posts"."salon_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "news_posts_platform_slug_unique" ON "news_posts" USING btree ("slug") WHERE "news_posts"."salon_id" is null;--> statement-breakpoint
CREATE INDEX "news_posts_status_published_idx" ON "news_posts" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "news_posts_salon_published_idx" ON "news_posts" USING btree ("salon_id","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "salon_admins_user_idx" ON "salon_admins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salons_slug_unique" ON "salons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "salons_audience_active_idx" ON "salons" USING btree ("audience","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_overrides_period_unique" ON "schedule_overrides" USING btree ("salon_id","local_date","opens_at");--> statement-breakpoint
CREATE INDEX "schedule_overrides_salon_date_idx" ON "schedule_overrides" USING btree ("salon_id","local_date");--> statement-breakpoint
CREATE UNIQUE INDEX "services_salon_name_unique" ON "services" USING btree ("salon_id","name");--> statement-breakpoint
CREATE INDEX "services_salon_active_idx" ON "services" USING btree ("salon_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_hours_period_unique" ON "weekly_hours" USING btree ("salon_id","day_of_week","opens_at");--> statement-breakpoint
CREATE INDEX "weekly_hours_salon_day_idx" ON "weekly_hours" USING btree ("salon_id","day_of_week");
--> statement-breakpoint
ALTER TABLE "weekly_hours"
  ADD CONSTRAINT "weekly_hours_no_active_overlap"
  EXCLUDE USING gist (
    "salon_id" WITH =,
    "day_of_week" WITH =,
    (int4range(extract(epoch FROM "opens_at")::integer, extract(epoch FROM "closes_at")::integer, '[)')) WITH &&
  ) WHERE ("is_active");
--> statement-breakpoint
ALTER TABLE "schedule_overrides"
  ADD CONSTRAINT "schedule_overrides_no_overlap"
  EXCLUDE USING gist (
    "salon_id" WITH =,
    "local_date" WITH =,
    (
      CASE
        WHEN "is_closed" THEN int4range(0, 86400, '[)')
        ELSE int4range(extract(epoch FROM "opens_at")::integer, extract(epoch FROM "closes_at")::integer, '[)')
      END
    ) WITH &&
  );
--> statement-breakpoint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_active_overlap"
  EXCLUDE USING gist (
    "salon_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'CONFIRMED'));
