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

  publicOrderNumber: text("public_order_number").unique(),

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


export const donationContributions = pgTable(
  "donation_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id").notNull(),
    publicOrderNumber: text("public_order_number").notNull(),

    stripeSessionId: text("stripe_session_id").unique().notNull(),

    amount: integer("amount").notNull(),
    orderTotal: integer("order_total").notNull(),
    rate: integer("rate").notNull().default(5),

    currency: text("currency").notNull().default("jpy"),
    status: text("status").notNull().default("confirmed"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("donation_contributions_order_id_idx").on(table.orderId),
    stripeSessionIdIdx: index("donation_contributions_stripe_session_id_idx").on(
      table.stripeSessionId
    ),
    statusIdx: index("donation_contributions_status_idx").on(table.status),
    createdAtIdx: index("donation_contributions_created_at_idx").on(table.createdAt),
  })
)

export const productVotes = pgTable(
  "product_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: text("product_id").notNull(),
    rating: integer("rating").notNull(),
    voterHash: text("voter_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_votes_product_id_idx").on(table.productId),
    voterHashIdx: index("product_votes_voter_hash_idx").on(table.voterHash),
    createdAtIdx: index("product_votes_created_at_idx").on(table.createdAt),
    productVoterIdx: index("product_votes_product_voter_idx").on(
      table.productId,
      table.voterHash
    ),
  })
)
export const productComments = pgTable(
  "product_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: text("product_id").notNull(),
    rating: integer("rating").notNull(),

    comment: text("comment").notNull(),
    authorName: text("author_name").notNull(),

    voterHash: text("voter_hash").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_comments_product_id_idx").on(table.productId),

    voterHashIdx: index("product_comments_voter_hash_idx").on(
      table.voterHash
    ),

    uniqueUserPerProductIdx: index("product_comments_unique_user").on(
      table.productId,
      table.voterHash
    ),
  })
)