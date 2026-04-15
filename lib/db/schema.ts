import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core"

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeSessionId: text("stripe_session_id").unique().notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),

  customerPostalCode: text("customer_postal_code").notNull().default(""),
  customerPrefecture: text("customer_prefecture").notNull().default(""),
  customerCity: text("customer_city").notNull().default(""),
  customerAddressLine1: text("customer_address_line1").notNull().default(""),
  customerAddressLine2: text("customer_address_line2").notNull().default(""),

  totalAmount: integer("total_amount").notNull(),
  items: jsonb("items").notNull(),
  status: text("status").notNull().default("paid"),

  shippingCarrier: text("shipping_carrier"),
  trackingNumber: text("tracking_number"),
  shippingNote: text("shipping_note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    stripeEventId: text("stripe_event_id").unique().notNull(),
    eventType: text("event_type").notNull(),
    stripeSessionId: text("stripe_session_id"),

    status: text("status").notNull().default("processing"),
    errorMessage: text("error_message"),

    payload: jsonb("payload").notNull(),

    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    stripeEventIdIdx: index("webhook_events_stripe_event_id_idx").on(table.stripeEventId),
    stripeSessionIdIdx: index("webhook_events_stripe_session_id_idx").on(table.stripeSessionId),
    statusIdx: index("webhook_events_status_idx").on(table.status),
    createdAtIdx: index("webhook_events_created_at_idx").on(table.createdAt),
  })
)