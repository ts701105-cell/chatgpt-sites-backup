CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`requestId` text NOT NULL,
	`objectKey` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`originalType` text NOT NULL,
	`newType` text NOT NULL,
	`uploadedBy` text NOT NULL,
	`created` text NOT NULL
);
