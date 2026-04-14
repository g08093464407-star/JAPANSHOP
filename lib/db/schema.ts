import { pgTable, text, timestamp, integer, uuid, jsonb } from "drizzle-orm/pg-core"

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
})