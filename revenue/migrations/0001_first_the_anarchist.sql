ALTER TABLE "bills" ALTER COLUMN "meter_reading_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "meter_reading_id" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "meter_reading_id" DROP NOT NULL;