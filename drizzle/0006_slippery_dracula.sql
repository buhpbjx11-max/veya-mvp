CREATE TABLE `canvasObjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`shape` enum('rect','circle') NOT NULL DEFAULT 'rect',
	`name` varchar(100),
	`x` decimal(8,2) NOT NULL DEFAULT '0',
	`y` decimal(8,2) NOT NULL DEFAULT '0',
	`w` decimal(8,2) NOT NULL DEFAULT '160',
	`h` decimal(8,2) NOT NULL DEFAULT '70',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `canvasObjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seatingVenueFrame` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`widthM` int NOT NULL DEFAULT 20,
	`heightM` int NOT NULL DEFAULT 30,
	`x` decimal(8,2) NOT NULL DEFAULT '0',
	`y` decimal(8,2) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seatingVenueFrame_id` PRIMARY KEY(`id`),
	CONSTRAINT `seatingVenueFrame_coupleId_unique` UNIQUE(`coupleId`)
);
--> statement-breakpoint
ALTER TABLE `seatingTables` MODIFY COLUMN `shape` enum('round','rect','couple') NOT NULL DEFAULT 'round';--> statement-breakpoint
ALTER TABLE `couples` ADD `photoQrToken` varchar(64);--> statement-breakpoint
ALTER TABLE `seatingTables` ADD `tableNumber` int;--> statement-breakpoint
ALTER TABLE `seatingTables` ADD `name` varchar(100);--> statement-breakpoint
ALTER TABLE `seatingTables` ADD `customW` decimal(8,2);--> statement-breakpoint
ALTER TABLE `seatingTables` ADD `customH` decimal(8,2);--> statement-breakpoint
ALTER TABLE `couples` ADD CONSTRAINT `couples_photoQrToken_unique` UNIQUE(`photoQrToken`);