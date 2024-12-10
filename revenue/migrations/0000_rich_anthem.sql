CREATE TABLE IF NOT EXISTS "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"bill_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"billing_period_start" timestamp,
	"billing_period_end" timestamp,
	"meter_reading_id" serial NOT NULL,
	"details" jsonb,
	CONSTRAINT "bills_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meter_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"previous_reading" numeric(10, 2),
	"current_reading" numeric(10, 2),
	"consumption" numeric(10, 2),
	"reading_date" timestamp DEFAULT now() NOT NULL,
	"reader_name" varchar(255),
	"reading_type" varchar(20),
	"photo_evidence" varchar(255),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parking_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" serial NOT NULL,
	"vehicle_type" varchar(20) NOT NULL,
	"number_plate" varchar(20) NOT NULL,
	"zone" varchar(50) NOT NULL,
	"parking_type" varchar(50) NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"last_payment" numeric(10, 2),
	"last_payment_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(50) NOT NULL,
	"service_account_id" serial NOT NULL,
	"bill_id" serial NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"processing_fee" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_details" jsonb,
	"metadata" jsonb,
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"service_id" serial NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"meter_number" varchar(50),
	"service_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"last_reading" numeric(10, 2),
	"last_reading_date" timestamp,
	"last_charge" numeric(10, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_code" varchar(10) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"description" text,
	"service_type" varchar(20) NOT NULL,
	"billing_rules" jsonb NOT NULL,
	"billing_period" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "services_service_code_unique" UNIQUE("service_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_meter_reading_id_meter_readings_id_fk" FOREIGN KEY ("meter_reading_id") REFERENCES "public"."meter_readings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_records" ADD CONSTRAINT "parking_records_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
