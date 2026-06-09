CREATE TABLE `external_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`weddingId` int,
	`name` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`whatsapp` varchar(20),
	`email` varchar(320),
	`receiveReports` boolean NOT NULL DEFAULT true,
	`reportTypes` json,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_staff_id` PRIMARY KEY(`id`)
);
