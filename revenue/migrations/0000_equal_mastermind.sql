CREATE TYPE "public"."service_type" AS ENUM('WTR', 'BIZ', 'LND', 'WST', 'PRK');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parking_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"vehicle_type" varchar NOT NULL,
	"zone" varchar NOT NULL,
	"duration" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"payment_id" serial NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now(),
	"status" "status" DEFAULT 'COMPLETED',
	"details" jsonb,
	"reference" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"service_type" varchar(10) NOT NULL,
	"account_number" varchar NOT NULL,
	"status" "status" DEFAULT 'ACTIVE',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"billing_rules" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar,
	"phone" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "water_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"previous_reading" numeric(10, 2),
	"current_reading" numeric(10, 2) NOT NULL,
	"consumption" numeric(10, 2),
	"reading_date" timestamp DEFAULT now(),
	"payment_id" serial NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_transactions" ADD CONSTRAINT "parking_transactions_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_transactions" ADD CONSTRAINT "parking_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_service_type_services_code_fk" FOREIGN KEY ("service_type") REFERENCES "public"."services"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "water_readings" ADD CONSTRAINT "water_readings_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "water_readings" ADD CONSTRAINT "water_readings_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
