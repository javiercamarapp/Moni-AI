
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "has_seen_journey_tutorial" BOOLEAN DEFAULT FALSE;
