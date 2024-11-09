import { pgTable, serial, text, varchar, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Define the schema
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  purposeOfPay: jsonb('purpose_of_pay').notNull(), // Array of services
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

