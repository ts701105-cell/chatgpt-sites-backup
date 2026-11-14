CREATE TABLE `attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`number` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hire` text NOT NULL,
	`hash` text NOT NULL,
	`salt` text NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL,
	`mustChange` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`date` text NOT NULL,
	`slot` text NOT NULL,
	`units` real NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`created` text NOT NULL,
	`reviewed` text
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`expires` integer NOT NULL
);
