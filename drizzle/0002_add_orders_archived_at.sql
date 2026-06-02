ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamp;

CREATE INDEX IF NOT EXISTS "orders_archived_at_idx"
  ON "orders" ("archived_at");
