CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`employee_name` text NOT NULL,
	`schedule_month` text NOT NULL,
	`rest_days` text DEFAULT '[]' NOT NULL,
	`regular_days` text DEFAULT '[]' NOT NULL,
	`rest_count` integer DEFAULT 0 NOT NULL,
	`regular_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_employee_month_unique` ON `schedules` (`employee_id`,`schedule_month`);