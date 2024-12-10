ALTER TABLE "bills" ALTER COLUMN "meter_reading_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "service_accounts" ALTER COLUMN "service_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "service_accounts" ALTER COLUMN "service_id" DROP NOT NULL;