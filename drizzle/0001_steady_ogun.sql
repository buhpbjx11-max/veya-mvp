CREATE TABLE `access_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('legal','cpa','tax') NOT NULL,
	`scope` varchar(255),
	`permission` enum('view','download','edit') NOT NULL DEFAULT 'view',
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`approvedByBar` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(255),
	`estimatedAmount` decimal(10,2),
	`actualAmount` decimal(10,2),
	`paid` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `couples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name1` varchar(255) NOT NULL,
	`phone1` varchar(20),
	`name2` varchar(255) NOT NULL,
	`phone2` varchar(20),
	`primaryContact` enum('1','2') NOT NULL DEFAULT '1',
	`email` varchar(320),
	`weddingDate` timestamp,
	`type` enum('venue_linked','independent') NOT NULL DEFAULT 'independent',
	`venueId` int,
	`assignmentLocked` boolean NOT NULL DEFAULT false,
	`plan` enum('base','premium') NOT NULL DEFAULT 'base',
	`storageStatus` enum('active','readonly','deleted') NOT NULL DEFAULT 'active',
	`deleteAt` timestamp,
	`sideLabels` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerType` enum('venue','couple','platform') NOT NULL,
	`ownerId` int,
	`type` varchar(100) NOT NULL,
	`status` varchar(50) DEFAULT 'active',
	`fileKey` varchar(500),
	`signed` boolean NOT NULL DEFAULT false,
	`signedAt` timestamp,
	`signatureData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`accessLevel` enum('view_only','limited_edit') NOT NULL DEFAULT 'view_only',
	`assignedArea` varchar(100),
	`inviteToken` varchar(64),
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_access_inviteToken_unique` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`venueId` int,
	`ratings` json,
	`systemFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`side` varchar(100),
	`group` varchar(100),
	`phone` varchar(20),
	`rsvpStatus` enum('pending','yes','no','maybe') NOT NULL DEFAULT 'pending',
	`diet` json,
	`tableId` int,
	`giftAmount` decimal(10,2),
	`giftNote` text,
	`thanked` boolean NOT NULL DEFAULT false,
	`inviteToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guests_id` PRIMARY KEY(`id`),
	CONSTRAINT `guests_inviteToken_unique` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`venueId` int NOT NULL,
	`plan` enum('basic','business','pro') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`vat` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft',
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueName` varchar(255),
	`contact` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`source` enum('contact_form','manual','outreach') NOT NULL DEFAULT 'manual',
	`stage` enum('lead','meeting','proposal','closed') NOT NULL DEFAULT 'lead',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationType` enum('venue_couple','couple_vendor','venue_vendor') NOT NULL,
	`conversationId` varchar(100) NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255),
	`content` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`uploadedBy` varchar(100) NOT NULL DEFAULT 'couple',
	`guestId` int,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`plan` enum('basic','business','pro') NOT NULL,
	`monthlyAmount` decimal(10,2) NOT NULL,
	`nextBillingAt` timestamp,
	`auto` boolean NOT NULL DEFAULT true,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seatingTables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`capacity` int NOT NULL DEFAULT 10,
	`shape` enum('round','rect') NOT NULL DEFAULT 'round',
	`x` decimal(8,2) NOT NULL DEFAULT '0',
	`y` decimal(8,2) NOT NULL DEFAULT '0',
	`w` decimal(8,2) NOT NULL DEFAULT '100',
	`h` decimal(8,2) NOT NULL DEFAULT '100',
	`rotation` decimal(6,2) NOT NULL DEFAULT '0',
	`assignedGuests` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seatingTables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tool_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`toolName` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tool_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerType` enum('venue','couple') NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`phone` varchar(20),
	`contact` varchar(320),
	`status` varchar(50) DEFAULT 'active',
	`recommended` boolean NOT NULL DEFAULT false,
	`docs` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`region` varchar(100),
	`contact` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`plan` enum('basic','business','pro') NOT NULL DEFAULT 'basic',
	`billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`subStatus` enum('trial','active','locked','cancelled') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`coupleAccess` enum('free','resell') NOT NULL DEFAULT 'free',
	`resellPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`coupleId` int,
	`date` timestamp,
	`status` enum('prep','active','done') NOT NULL DEFAULT 'prep',
	`balanceDue` decimal(10,2) DEFAULT '0',
	`timeline` json,
	`documents` json,
	`inviteToken` varchar(64),
	`guestPhotoUploadClosedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddings_id` PRIMARY KEY(`id`),
	CONSTRAINT `weddings_inviteToken_unique` UNIQUE(`inviteToken`)
);
