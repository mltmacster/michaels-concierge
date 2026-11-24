CREATE TABLE `userSessions` (
	`sessionIdHash` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`createdAtMs` bigint NOT NULL,
	`expiresAtMs` bigint NOT NULL,
	`lastSeenAtMs` bigint NOT NULL,
	`revokedAtMs` bigint,
	CONSTRAINT `userSessions_sessionIdHash` PRIMARY KEY(`sessionIdHash`)
);
--> statement-breakpoint
ALTER TABLE `userSessions` ADD CONSTRAINT `userSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userSessions_userId_idx` ON `userSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `userSessions_expiry_idx` ON `userSessions` (`expiresAtMs`);