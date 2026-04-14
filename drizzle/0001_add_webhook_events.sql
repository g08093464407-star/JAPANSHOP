CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stripe_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "stripe_session_id" text,
  "status" text DEFAULT 'processing' NOT NULL,
  "error_message" text,
  "payload" jsonb NOT NULL,
  "processed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);

CREATE INDEX IF NOT EXISTS "webhook_events_stripe_event_id_idx"
  ON "webhook_events" ("stripe_event_id");

CREATE INDEX IF NOT EXISTS "webhook_events_stripe_session_id_idx"
  ON "webhook_events" ("stripe_session_id");

CREATE INDEX IF NOT EXISTS "webhook_events_status_idx"
  ON "webhook_events" ("status");

CREATE INDEX IF NOT EXISTS "webhook_events_created_at_idx"
  ON "webhook_events" ("created_at");