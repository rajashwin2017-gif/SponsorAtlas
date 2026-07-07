-- SponsorAtlas API server — raw SQL schema (MySQL).
-- Run with: npm run migrate

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255),
  `image` VARCHAR(512),
  `password` VARCHAR(255),                              -- bcrypt hash
  `role` ENUM('MEMBER', 'ADMIN') NOT NULL DEFAULT 'MEMBER',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `email_verified` DATETIME NULL,
  `subscription_tier` VARCHAR(20) NOT NULL DEFAULT 'free',
  `subscription_status` VARCHAR(20) NOT NULL DEFAULT 'inactive',
  `stripe_customer_id` VARCHAR(255),
  `stripe_subscription_id` VARCHAR(255),
  `monthly_checks_used` INT NOT NULL DEFAULT 0,
  `monthly_checks_limit` INT NOT NULL DEFAULT 5,
  `alert_frequency` VARCHAR(20) NOT NULL DEFAULT 'weekly',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_users_role` (`role`),
  KEY `idx_users_stripe_customer` (`stripe_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `identifier` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires` DATETIME NOT NULL,
  PRIMARY KEY (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_password_reset_tokens_user` (`user_id`),
  CONSTRAINT `fk_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `stripe_subscription_id` VARCHAR(255) NOT NULL UNIQUE,
  `stripe_price_id` VARCHAR(255) NOT NULL DEFAULT '',
  `plan` VARCHAR(20) NOT NULL,                          -- 'pro' | 'pro_plus'
  `interval` VARCHAR(10) NOT NULL,                      -- 'month' | 'year'
  `status` VARCHAR(20) NOT NULL,                         -- Stripe subscription status
  `current_period_end` DATETIME NULL,
  `cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_subscriptions_user` (`user_id`),
  KEY `idx_subscriptions_status` (`status`),
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `stripe_payment_intent_id` VARCHAR(255) UNIQUE,
  `stripe_invoice_id` VARCHAR(255),
  `amount` INT NOT NULL,                                -- minor units (pence/cents)
  `currency` VARCHAR(10) NOT NULL DEFAULT 'gbp',
  `status` VARCHAR(20) NOT NULL,                         -- 'succeeded' | 'failed' | 'refunded' | 'pending'
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_payments_user` (`user_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_created` (`created_at`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `stripe_invoice_id` VARCHAR(255) NOT NULL UNIQUE,
  `amount` INT NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'gbp',
  `status` VARCHAR(20) NOT NULL,                         -- 'paid' | 'open' | 'void' | 'uncollectible'
  `hosted_invoice_url` VARCHAR(1024),
  `pdf_url` VARCHAR(1024),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_invoices_user` (`user_id`),
  KEY `idx_invoices_created` (`created_at`),
  CONSTRAINT `fk_invoices_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `actor_id` CHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,                        -- e.g. 'user.suspend', 'payment.refund'
  `target_type` VARCHAR(50),
  `target_id` VARCHAR(255),
  `metadata` JSON,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_audit_logs_actor` (`actor_id`),
  KEY `idx_audit_logs_created` (`created_at`),
  KEY `idx_audit_logs_action` (`action`),
  CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
