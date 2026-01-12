ALTER TABLE "issue_reports" RENAME TO "feedbacks";--> statement-breakpoint
ALTER TABLE "feedbacks" DROP CONSTRAINT "issue_reports_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;