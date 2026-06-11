CREATE TABLE `venue_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`venueName` varchar(255) NOT NULL,
	`venuePhone` varchar(20),
	`venueWhatsapp` varchar(20),
	`sharedSections` json NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`revoked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venue_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `venue_shares_shareToken_unique` UNIQUE(`shareToken`)
);
