ALTER TABLE "access_keys" ADD COLUMN "memo" text;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_boards" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;