CREATE TABLE "issue_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"access_key_id" integer NOT NULL,
	"access_key_memo" text,
	"phone" varchar(20) DEFAULT '',
	"is_solved" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "files" CASCADE;--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "memo" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "memo" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;