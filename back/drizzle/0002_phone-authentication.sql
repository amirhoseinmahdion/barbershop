ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
WITH "missing_phone" AS (
  SELECT "id", row_number() OVER (ORDER BY "id") AS "position"
  FROM "users"
  WHERE "phone" IS NULL
)
UPDATE "users"
SET "phone" = '+999' || lpad("missing_phone"."position"::text, 12, '0')
FROM "missing_phone"
WHERE "users"."id" = "missing_phone"."id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_not_blank_check" CHECK (length(trim("users"."phone")) > 0);
