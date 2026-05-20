import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  jsonb,
  index,
  uniqueIndex,
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
  itemsSubtotal: integer("items_subtotal").notNull().default(0),
  shippingAmount: integer("shipping_amount").notNull().default(0),
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
    donationBaseAmount: integer("donation_base_amount").notNull().default(0),
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
    productVoterIdx: uniqueIndex("product_votes_product_voter_idx").on(
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
export const catalogProducts = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    legacyId: text("legacy_id").unique().notNull(),
    slug: text("slug").unique().notNull(),

    name: text("name").notNull(),
    price: integer("price").notNull(),

    shortDescription: text("short_description"),
    description: text("description").notNull(),

    origin: text("origin"),
    ingredients: text("ingredients"),
    allergens: text("allergens"),
    shelfLife: text("shelf_life"),
    storage: text("storage"),

    category: text("category"),
    tag: text("tag"),

    stockStatus: text("stock_status").notNull().default("in-stock"),
    stockQuantity: integer("stock_quantity"),

    status: text("status").notNull().default("draft"),
    isActive: boolean("is_active").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalSlug: text("canonical_slug"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    legacyIdIdx: index("products_legacy_id_idx").on(table.legacyId),
    slugIdx: index("products_slug_idx").on(table.slug),
    statusIdx: index("products_status_idx").on(table.status),
    stockStatusIdx: index("products_stock_status_idx").on(table.stockStatus),
    isActiveIdx: index("products_is_active_idx").on(table.isActive),
    isArchivedIdx: index("products_is_archived_idx").on(table.isArchived),
    categoryIdx: index("products_category_idx").on(table.category),
    createdAtIdx: index("products_created_at_idx").on(table.createdAt),
  })
)

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull(),

    url: text("url").notNull(),
    alt: text("alt"),
    role: text("role").notNull().default("gallery"),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_images_product_id_idx").on(table.productId),
    roleIdx: index("product_images_role_idx").on(table.role),
    sortOrderIdx: index("product_images_sort_order_idx").on(table.sortOrder),
  })
)

export const productShippingProfiles = pgTable(
  "product_shipping_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull(),

    shippingOriginPrefecture: text("shipping_origin_prefecture")
      .notNull()
      .default("愛知県"),
    sizeClass: integer("size_class").notNull().default(60),
    volumeUnits: integer("volume_units").notNull().default(1),
    lengthCm: integer("length_cm"),
    widthCm: integer("width_cm"),
    heightCm: integer("height_cm"),
    volumeCm3: integer("volume_cm3"),
    weightGrams: integer("weight_grams"),

    packageType: text("package_type").notNull().default("standard"),
    temperatureType: text("temperature_type").notNull().default("ambient"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: uniqueIndex("product_shipping_profiles_product_id_idx").on(
      table.productId
    ),
    originPrefectureIdx: index("product_shipping_profiles_origin_prefecture_idx").on(
      table.shippingOriginPrefecture
    ),
    sizeClassIdx: index("product_shipping_profiles_size_class_idx").on(table.sizeClass),
    volumeCm3Idx: index("product_shipping_profiles_volume_cm3_idx").on(table.volumeCm3),
  })
)

export const productFaqItems = pgTable(
  "product_faq_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull(),

    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_faq_items_product_id_idx").on(table.productId),
    isActiveIdx: index("product_faq_items_is_active_idx").on(table.isActive),
    sortOrderIdx: index("product_faq_items_sort_order_idx").on(table.sortOrder),
  })
)

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),

    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityTypeIdx: index("admin_audit_logs_entity_type_idx").on(table.entityType),
    entityIdIdx: index("admin_audit_logs_entity_id_idx").on(table.entityId),
    actionIdx: index("admin_audit_logs_action_idx").on(table.action),
    createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
  })
)
