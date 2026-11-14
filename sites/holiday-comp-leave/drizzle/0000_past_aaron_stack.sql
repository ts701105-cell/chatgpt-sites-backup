CREATE TABLE `comp_leave_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`department` text NOT NULL,
	`employee` text NOT NULL,
	`holiday_date` text NOT NULL,
	`holiday_name` text NOT NULL,
	`compensation_status` text NOT NULL,
	`compensation_date` text,
	`created_at` integer NOT NULL
);
