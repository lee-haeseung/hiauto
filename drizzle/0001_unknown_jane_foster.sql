CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boards_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"policy" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sub_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_slug_unique";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sub_board_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_boards" ADD CONSTRAINT "sub_boards_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_sub_board_id_sub_boards_id_fk" FOREIGN KEY ("sub_board_id") REFERENCES "public"."sub_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_keys" DROP COLUMN "used_count";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "is_published";