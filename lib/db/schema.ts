import { pgTable, text, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  stripeSessionId: text('stripe_session_id').unique().notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  totalAmount: integer('total_amount').notNull(), // ціна в копійках/єнах
  items: jsonb('items').notNull(),
  status: text('status').notNull().default('paid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
