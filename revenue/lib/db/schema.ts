// schema.ts
import { pgTable, serial, varchar, decimal, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const serviceTypeEnum = pgEnum('service_type', [
  'WTR', 'BIZ', 'LND', 'WST', 'PRK'
]);

export const statusEnum = pgEnum('status', [
  'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'COMPLETED', 'FAILED'
]);

// Core tables
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  phone: varchar('phone'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const services = pgTable('services', {
  code: varchar('code', { length: 10 }).primaryKey(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  billing_rules: jsonb('billing_rules').notNull(),
  created_at: timestamp('created_at').defaultNow()
});

export const serviceAccounts = pgTable('service_accounts', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id').references(() => users.id).notNull(),
  service_type: varchar('service_type', { length: 10 })
    .references(() => services.code)
    .notNull(),
  account_number: varchar('account_number').notNull().unique(),
  status: statusEnum('status').default('ACTIVE'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id')
    .references(() => serviceAccounts.id)
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  payment_date: timestamp('payment_date').defaultNow(),
  status: statusEnum('status').default('COMPLETED'),
  details: jsonb('details'),
  reference: varchar('reference', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const waterReadings = pgTable('water_readings', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id')
    .references(() => serviceAccounts.id)
    .notNull(),
  previous_reading: decimal('previous_reading', { precision: 10, scale: 2 }),
  current_reading: decimal('current_reading', { precision: 10, scale: 2 }).notNull(),
  consumption: decimal('consumption', { precision: 10, scale: 2 }),
  reading_date: timestamp('reading_date').defaultNow(),
  payment_id: serial('payment_id').references(() => payments.id),
  created_at: timestamp('created_at').defaultNow()
});

export const parkingTransactions = pgTable('parking_transactions', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id')
    .references(() => serviceAccounts.id)
    .notNull(),
  vehicle_type: varchar('vehicle_type').notNull(),
  zone: varchar('zone').notNull(),
  duration: varchar('duration').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time'),
  payment_id: serial('payment_id').references(() => payments.id),
  created_at: timestamp('created_at').defaultNow()
});