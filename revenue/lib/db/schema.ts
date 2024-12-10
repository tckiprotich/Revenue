// lib/db/schema.ts
import { pgTable, serial, text, varchar, numeric, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

// Base users table
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 500 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Services catalog
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  service_code: varchar('service_code', { length: 10 }).unique().notNull(),
  service_name: varchar('service_name', { length: 255 }).notNull(),
  description: text('description'),
  service_type: varchar('service_type', { length: 20 }).notNull(), // Using varchar instead of enum
  billing_rules: jsonb('billing_rules').notNull(),
  billing_period: varchar('billing_period', { length: 50 }),
  is_active: boolean('is_active').default(true).notNull(),
});

// Service accounts
export const serviceAccounts = pgTable('service_accounts', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id').notNull().references(() => users.id),
  service_id: integer('service_id').references(() => services.id), // Change from serial to integer
  account_number: varchar('account_number', { length: 50 }).unique().notNull(),
  meter_number: varchar('meter_number', { length: 50 }),
  service_type: varchar('service_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  last_reading: numeric('last_reading', { precision: 10, scale: 2 }),
  last_reading_date: timestamp('last_reading_date'),
  last_charge: numeric('last_charge', { precision: 10, scale: 2 }),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Meter readings
export const meterReadings = pgTable('meter_readings', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id').references(() => serviceAccounts.id),
  previous_reading: numeric('previous_reading', { precision: 10, scale: 2 }),
  current_reading: numeric('current_reading', { precision: 10, scale: 2 }),
  consumption: numeric('consumption', { precision: 10, scale: 2 }),
  reading_date: timestamp('reading_date').defaultNow().notNull(),
  reader_name: varchar('reader_name', { length: 255 }),
  reading_type: varchar('reading_type', { length: 20 }),
  photo_evidence: varchar('photo_evidence', { length: 255 }),
  notes: text('notes'),
});

// Parking records
export const parkingRecords = pgTable('parking_records', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id').references(() => serviceAccounts.id),
  vehicle_type: varchar('vehicle_type', { length: 20 }).notNull(),
  number_plate: varchar('number_plate', { length: 20 }).notNull(),
  zone: varchar('zone', { length: 50 }).notNull(),
  parking_type: varchar('parking_type', { length: 50 }).notNull(),
  start_time: timestamp('start_time').defaultNow().notNull(),
  end_time: timestamp('end_time'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  last_payment: numeric('last_payment', { precision: 10, scale: 2 }),
  last_payment_date: timestamp('last_payment_date'),
});

// Bills
export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  service_account_id: serial('service_account_id').references(() => serviceAccounts.id),
  bill_number: varchar('bill_number', { length: 50 }).unique().notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  bill_date: timestamp('bill_date').defaultNow().notNull(),
  due_date: timestamp('due_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  billing_period_start: timestamp('billing_period_start'),
  billing_period_end: timestamp('billing_period_end'),
   meter_reading_id: integer('meter_reading_id').references(() => meterReadings.id), 
  details: jsonb('details'),
});

// Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  transaction_id: varchar('transaction_id', { length: 50 }).unique().notNull(),
  service_account_id: serial('service_account_id').references(() => serviceAccounts.id),
  bill_id: serial('bill_id').references(() => bills.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  processing_fee: numeric('processing_fee', { precision: 10, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  payment_method: varchar('payment_method', { length: 50 }).notNull(),
  payment_details: jsonb('payment_details'),
  metadata: jsonb('metadata'),
});