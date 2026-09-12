-- ============================================================================
-- Shop Express - Complete TiDB Cloud Migration Script
-- Database: shop_express
-- Generated for: TiDB Cloud Serverless (MySQL 8.0 compatible)
-- Includes:
--   1. All 19 Table DDL definitions with indexes and foreign key constraints
--   2. Complete seed & catalog data in strict relational dependency order
-- Security:
--   - No real user passwords or JWT secrets included
--   - All test user accounts use standard bcrypt hash for password: 'password123'
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `shop_express`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `shop_express`;

-- Temporarily disable foreign key checks during batch setup
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PART 1: DDL - TABLE DEFINITIONS & CONSTRAINTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT UNSIGNED NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: addresses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `address_type` ENUM('shipping', 'billing', 'both') NOT NULL DEFAULT 'shipping',
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'India',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_addresses_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `parent_id` INT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_categories_slug` (`slug`),
  INDEX `idx_categories_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(280) NOT NULL UNIQUE,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `base_price` DECIMAL(10, 2) NOT NULL,
  `discount_price` DECIMAL(10, 2) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_products_category_id` (`category_id`),
  INDEX `idx_products_slug` (`slug`),
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_active_price` (`is_active`, `base_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: product_variants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `variant_name` VARCHAR(100) NOT NULL,
  `price_modifier` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_product_variants_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: product_images
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `alt_text` VARCHAR(255) NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  INDEX `idx_product_images_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `reserved_quantity` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 5,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uq_inventory_prod_variant` UNIQUE (`product_id`, `variant_id`),
  INDEX `idx_inventory_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: coupons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `min_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` DECIMAL(10, 2) NULL,
  `usage_limit` INT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `per_user_limit` INT NOT NULL DEFAULT 1,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_coupons_code` (`code`),
  INDEX `idx_coupons_dates` (`start_date`, `end_date`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: coupon_usages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupon_usages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `coupon_id` INT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `used_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_coupon_usages_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_coupon_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_coupon_usages_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_coupon_usages_coupon_user` (`coupon_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: carts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NULL UNIQUE,
  `session_id` VARCHAR(255) NULL UNIQUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_carts_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: cart_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uq_cart_prod_variant` UNIQUE (`cart_id`, `product_id`, `variant_id`),
  INDEX `idx_cart_items_cart_id` (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `shipping_address_id` BIGINT UNSIGNED NULL,
  `billing_address_id` BIGINT UNSIGNED NULL,
  `coupon_id` INT UNSIGNED NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `shipping_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `order_status` ENUM('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_billing_address` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  INDEX `idx_orders_user_id` (`user_id`),
  INDEX `idx_orders_status` (`order_status`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_number` (`order_number`),
  INDEX `idx_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: order_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `variant_name` VARCHAR(100) NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `quantity` INT NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  INDEX `idx_order_items_order_id` (`order_id`),
  INDEX `idx_order_items_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `payment_method` ENUM('card', 'upi', 'net_banking', 'wallet', 'cod') NOT NULL,
  `transaction_reference` VARCHAR(255) NULL UNIQUE,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_gateway_response` JSON NULL,
  `paid_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_payments_order_id` (`order_id`),
  INDEX `idx_payments_status` (`payment_status`),
  INDEX `idx_payments_reference` (`transaction_reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: order_status_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL,
  `comment` VARCHAR(255) NULL,
  `changed_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_order_history_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: wishlists
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: wishlist_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wishlist_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist_product` (`wishlist_id`, `product_id`),
  INDEX `idx_wishlist_items_wishlist_id` (`wishlist_id`),
  INDEX `idx_wishlist_items_product_id` (`product_id`),
  CONSTRAINT `fk_wishlist_items_wishlist` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: product_reviews
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `review_title` VARCHAR(255) NULL,
  `review_text` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_product_review` (`user_id`, `product_id`),
  INDEX `idx_reviews_product_id` (`product_id`),
  INDEX `idx_reviews_user_id` (`user_id`),
  INDEX `idx_reviews_is_active` (`is_active`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 2: DATA INSERTION (RELATIONAL DEPENDENCY ORDER)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Data for: roles (2 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`)
VALUES
  (1, 'customer', 'Standard registered customer with storefront access', '2026-09-11 13:32:41'),
  (2, 'admin', 'Administrative user with full catalog and order management access', '2026-09-11 13:32:41')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: users (10 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'Demo', 'Customer', 'demo.customer@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', '+919876543210', 1, '2026-09-11 13:32:41', '2026-09-11 14:27:12'),
  (2, 2, 'Demo', 'Admin', 'demo.admin@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', '+919876543211', 1, '2026-09-11 13:32:41', '2026-09-11 14:27:12'),
  (3, 1, 'Alice', 'Smith', 'test_1789136817461@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 14:26:57', '2026-09-11 14:26:57'),
  (4, 1, 'Alice', 'Smith', 'test_1789136838189@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 14:27:18', '2026-09-11 14:27:18'),
  (5, 1, 'Lahari', 'Tummala', 'laharitummala333@gmail.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 14:31:57', '2026-09-11 14:31:57'),
  (6, 1, 'User', 'One', 'cart_user1_1789137840599@test.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 14:44:00', '2026-09-11 14:44:00'),
  (7, 1, 'User', 'Two', 'cart_user2_1789137840599@test.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 14:44:01', '2026-09-11 14:44:01'),
  (8, 1, 'Hacker', 'User', 'intruder_1789140677068@test.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 15:31:17', '2026-09-11 15:31:17'),
  (9, 1, 'Customer', 'Beta', 'test.customer.b@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-11 16:19:04', '2026-09-11 16:19:04'),
  (10, 1, 'pravallika', '', 'pravallika@gmail.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-12 03:00:27', '2026-09-12 03:00:27')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: addresses (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `addresses` (`id`, `user_id`, `address_type`, `is_default`, `full_name`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'both', 0, 'Demo Customer', '+919876543210', '101 Innovation Park', 'Koramangala 5th Block', 'Bengaluru', 'Karnataka', '560095', 'India', '2026-09-11 13:32:41', '2026-09-11 15:31:16'),
  (2, 1, 'shipping', 1, 'Demo Customer', '+91 9876543210', 'Flat 402, Sunshine Apartments', 'MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'India', '2026-09-11 15:31:16', '2026-09-11 15:31:16'),
  (3, 5, 'shipping', 1, 'Lahari Tummala', '987654321', 'Near ramalayam temple chekkapalli', NULL, 'Nuzvid', 'Andhra Pradesh', '521202', 'India', '2026-09-11 15:48:34', '2026-09-11 15:48:34')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: categories (5 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, NULL, 'Electronics', 'electronics', 'Audio, wearable tech, peripherals, and smart devices', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, NULL, 'Fashion', 'fashion', 'Apparel, footwear, and lifestyle accessories', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (3, NULL, 'Home & Kitchen', 'home-kitchen', 'Cookware, appliances, and home essentials', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (4, NULL, 'Sports & Fitness', 'sports-fitness', 'Workout gear, sporting equipment, and accessories', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (5, NULL, 'Books & Stationery', 'books-stationery', 'Educational, fiction, and professional literature', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: products (18 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, `base_price`, `discount_price`, `is_featured`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'Wireless Active Noise-Cancelling Headphones', 'wireless-anc-headphones', 'SKU-ELEC-001', 'High-fidelity audio with 40-hour battery life and hybrid ANC.', 'Experience studio-quality sound anywhere with these over-ear headphones featuring active noise cancellation, custom 40mm drivers, multipoint Bluetooth connectivity, and an ergonomic memory foam headband.', '2999.00', '2499.00', 1, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, 1, 'Smart AMOLED Fitness Tracker', 'smart-amoled-fitness-tracker', 'SKU-ELEC-002', 'Vibrant 1.4-inch display with heart-rate and SpO2 tracking.', 'Track all your daily metrics effortlessly. Features 5ATM water resistance, all-day heart rate monitoring, sleep analysis, and over 60 sports modes.', '3999.00', '3499.00', 1, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (3, 2, 'Classic Organic Cotton Crewneck T-Shirt', 'classic-organic-cotton-tshirt', 'SKU-FASH-001', '100% combed ringspun organic cotton for everyday comfort.', 'A wardrobe staple crafted from sustainably sourced 180 GSM combed cotton. Pre-shrunk, breathable, and reinforced with double-stitched hems.', '799.00', '599.00', 0, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (4, 3, 'Cold Brew Artisan Glass Coffee Maker', 'cold-brew-glass-coffee-maker', 'SKU-HOME-001', 'BPA-free borosilicate glass carafe with fine stainless steel filter.', 'Make smooth, low-acidity cold brew right in your refrigerator. Heavy-duty borosilicate glass with laser-cut stainless steel mesh infuser.', '1899.00', '1499.00', 1, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (5, 4, 'Pro-Grip High-Density Alignment Yoga Mat', 'pro-grip-alignment-yoga-mat', 'SKU-SPRT-001', 'Non-slip eco-friendly TPE surface with laser-etched posture lines.', 'Engineered for yogis of all levels. Provides 6mm of supportive cushioning, exceptional dual-sided grip, and laser-engraved central alignment guides.', '1299.00', '999.00', 0, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (6, 5, 'Full-Stack Architecture & Engineering Playbook', 'full-stack-architecture-playbook', 'SKU-BOOK-001', 'Comprehensive blueprint for designing scalable modern web systems.', 'An essential desktop companion for developers covering microservices, relational database schema optimization, caching patterns, and API architecture.', '699.00', '499.00', 1, 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (7, 5, 'Ergonomic Desk Mat 2466', 'ergonomic-desk-mat-2466', 'SKU-052472-449', 'Premium vegan leather large desk pad', 'Waterproof, non-slip dual-sided desk protector mat.', '1399.00', '1099.00', 1, 0, '2026-09-11 15:54:12', '2026-09-11 15:54:12'),
  (8, 1, 'Verification Test Gadget', 'verification-test-gadget-1789142519117', 'VTG-1789142519117', 'Test gadget for verification', 'Long description of test gadget', '1499.00', '1299.00', 1, 0, '2026-09-11 16:01:59', '2026-09-11 16:01:59'),
  (9, 1, 'Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'SPK-BLU-001', 'Compact wireless Bluetooth speaker with rich sound, deep bass, water resistance, and 12-hour battery.', 'Compact wireless Bluetooth speaker with rich sound, deep bass, water resistance, and up to 12 hours of battery life.', '1999.00', '1499.00', 1, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (10, 1, 'RGB Mechanical Gaming Keyboard', 'rgb-mechanical-gaming-keyboard', 'KEY-RGB-002', 'High-performance mechanical gaming keyboard with RGB backlighting, tactile switches, and anti-ghosting.', 'High-performance mechanical gaming keyboard with RGB backlighting, tactile switches, anti-ghosting, and a durable compact design.', '3499.00', '2799.00', 1, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (11, 2, 'Minimalist Laptop Backpack', 'minimalist-laptop-backpack', 'BAG-LAP-003', 'Water-resistant laptop backpack with padded compartments and comfortable ergonomic design.', 'Water-resistant laptop backpack with padded compartments, multiple storage pockets, and a comfortable design for college, work, and travel.', '1699.00', '1199.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (12, 2, 'Lightweight Premium Running Shoes', 'lightweight-premium-running-shoes', 'SHO-RUN-004', 'Lightweight running shoes with breathable mesh, cushioned soles, and flexible support.', 'Lightweight running shoes with breathable mesh, cushioned soles, flexible support, and a comfortable fit for daily workouts.', '3199.00', '2299.00', 1, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (13, 3, 'Ceramic Coffee Mug Set of 2', 'ceramic-coffee-mug-set-of-2', 'MUG-CER-005', 'Elegant ceramic coffee mug set with smooth finish and comfortable handles for home or office.', 'Elegant ceramic coffee mug set with a smooth finish, comfortable handles, and a modern design suitable for home or office use.', '899.00', '599.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (14, 3, 'Adjustable Smart LED Desk Lamp', 'adjustable-smart-led-desk-lamp', 'LMP-LED-006', 'Adjustable LED desk lamp with multiple brightness levels, flexible neck, and energy-efficient lighting.', 'Adjustable LED desk lamp with multiple brightness levels, flexible neck, energy-efficient lighting, and a modern minimalist design.', '1299.00', '899.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (15, 4, 'Insulated Stainless Steel Water Bottle', 'insulated-stainless-steel-water-bottle', 'BOT-INS-007', 'Double-wall insulated stainless steel water bottle keeping drinks cold or hot for hours.', 'Double-wall insulated stainless steel water bottle that keeps beverages cold or hot for hours. Leak-resistant and easy to carry.', '999.00', '749.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (16, 4, 'Adjustable Dumbbell Set', 'adjustable-dumbbell-set', 'DUM-ADJ-008', 'Adjustable dumbbell set for home workouts and strength training with quick-change weight settings.', 'Adjustable dumbbell set designed for home workouts, strength training, and muscle conditioning with easy-to-change weight settings.', '3499.00', '2499.00', 1, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (17, 5, 'Daily Productivity Planner', 'daily-productivity-planner', 'PLN-DAY-009', 'Undated daily planner with goal setting, habit tracking, and task priority sections.', 'Undated productivity planner with daily goals, task lists, habit tracking, notes, and reflection sections to organize your day effectively.', '599.00', '399.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (18, 5, 'Premium Ballpoint Pen Set', 'premium-ballpoint-pen-set', 'PEN-BAL-010', 'Smooth-writing ballpoint pen set with comfortable grip, quick-drying ink, and modern metallic design.', 'Smooth-writing premium ballpoint pen set with comfortable grip, quick-drying ink, and elegant design for school, college, and office use.', '449.00', '299.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: product_variants (17 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'SKU-ELEC-001-BLK', 'Matte Black', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, 1, 'SKU-ELEC-001-SLV', 'Silver White', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (3, 2, 'SKU-ELEC-002-BLU', 'Navy Blue Band', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (4, 3, 'SKU-FASH-001-M-BLK', 'Size: M / Black', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (5, 3, 'SKU-FASH-001-L-BLK', 'Size: L / Black', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (6, 4, 'SKU-HOME-001-1L', '1000ml Standard', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (7, 5, 'SKU-SPRT-001-TEAL', '6mm / Deep Teal', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (8, 6, 'SKU-BOOK-001-HC', 'Hardcover Edition', '0.00', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (9, 9, 'SPK-BLU-001-BLK', 'Matte Black', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (10, 9, 'SPK-BLU-001-BLU', 'Ocean Blue', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (11, 12, 'SHO-RUN-004-7', 'Size 7 UK/IN', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (12, 12, 'SHO-RUN-004-8', 'Size 8 UK/IN', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (13, 12, 'SHO-RUN-004-9', 'Size 9 UK/IN', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (14, 12, 'SHO-RUN-004-10', 'Size 10 UK/IN', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (15, 15, 'BOT-INS-007-500ML', '500 ml', '0.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (16, 15, 'BOT-INS-007-750ML', '750 ml', '50.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34'),
  (17, 15, 'BOT-INS-007-1L', '1 Litre', '100.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: product_images (18 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `product_images` (`id`, `product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`, `created_at`)
VALUES
  (1, 1, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', 'Matte Black Noise Cancelling Headphones', 1, 1, '2026-09-11 13:32:41'),
  (2, 2, 3, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Smart Fitness Tracker Display', 1, 1, '2026-09-11 13:32:41'),
  (3, 3, 4, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80', 'Classic Black Cotton T-Shirt', 1, 1, '2026-09-11 13:32:41'),
  (4, 4, 6, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80', 'Glass Cold Brew Coffee Maker', 1, 1, '2026-09-11 13:32:41'),
  (5, 5, 7, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80', 'Non-Slip Alignment Yoga Mat', 1, 1, '2026-09-11 13:32:41'),
  (6, 6, 8, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80', 'Full-Stack Architecture Book Cover', 1, 1, '2026-09-11 13:32:41'),
  (7, 7, NULL, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80', 'Ergonomic Desk Mat 2466', 1, 1, '2026-09-11 15:54:12'),
  (8, 8, NULL, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'Verification Test Gadget', 1, 1, '2026-09-11 16:01:59'),
  (9, 9, NULL, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80', 'Portable Bluetooth Speaker', 1, 1, '2026-09-12 03:18:34'),
  (10, 10, NULL, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 'RGB Mechanical Gaming Keyboard', 1, 1, '2026-09-12 03:18:34'),
  (11, 11, NULL, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', 'Minimalist Laptop Backpack', 1, 1, '2026-09-12 03:18:34'),
  (12, 12, NULL, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 'Lightweight Premium Running Shoes', 1, 1, '2026-09-12 03:18:34'),
  (13, 13, NULL, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80', 'Ceramic Coffee Mug Set of 2', 1, 1, '2026-09-12 03:18:34'),
  (14, 14, NULL, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', 'Adjustable Smart LED Desk Lamp', 1, 1, '2026-09-12 03:18:34'),
  (15, 15, NULL, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80', 'Insulated Stainless Steel Water Bottle', 1, 1, '2026-09-12 03:18:34'),
  (16, 16, NULL, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', 'Adjustable Dumbbell Set', 1, 1, '2026-09-12 03:18:34'),
  (17, 17, NULL, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80', 'Daily Productivity Planner', 1, 1, '2026-09-12 03:18:34'),
  (18, 18, NULL, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80', 'Premium Ballpoint Pen Set', 1, 1, '2026-09-12 03:18:34')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: inventory (26 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `inventory` (`id`, `product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`, `updated_at`)
VALUES
  (1, 1, 1, 39, 0, 5, '2026-09-11 15:31:17'),
  (2, 1, 2, 45, 0, 5, '2026-09-11 15:54:12'),
  (3, 2, 3, 35, 0, 5, '2026-09-11 13:32:41'),
  (4, 3, 4, 50, 0, 10, '2026-09-11 13:32:41'),
  (5, 3, 5, 45, 0, 10, '2026-09-11 13:32:41'),
  (6, 4, 6, 30, 0, 5, '2026-09-11 13:32:41'),
  (7, 5, 7, 60, 0, 8, '2026-09-11 13:32:41'),
  (8, 6, 8, 100, 0, 15, '2026-09-11 13:32:41'),
  (9, 7, NULL, 30, 0, 5, '2026-09-11 15:54:12'),
  (10, 8, NULL, 25, 0, 5, '2026-09-12 03:12:50'),
  (11, 9, 9, 15, 0, 5, '2026-09-12 03:18:34'),
  (12, 9, 10, 15, 0, 5, '2026-09-12 03:18:34'),
  (13, 10, NULL, 20, 0, 5, '2026-09-12 03:18:34'),
  (14, 11, NULL, 40, 0, 10, '2026-09-12 03:18:34'),
  (15, 12, 11, 6, 0, 3, '2026-09-12 03:18:34'),
  (16, 12, 12, 7, 0, 3, '2026-09-12 03:18:34'),
  (17, 12, 13, 6, 0, 3, '2026-09-12 03:18:34'),
  (18, 12, 14, 6, 0, 3, '2026-09-12 03:18:34'),
  (19, 13, NULL, 50, 0, 10, '2026-09-12 03:18:34'),
  (20, 14, NULL, 35, 0, 5, '2026-09-12 03:18:34'),
  (21, 15, 15, 15, 0, 5, '2026-09-12 03:18:34'),
  (22, 15, 16, 15, 0, 5, '2026-09-12 03:18:34'),
  (23, 15, 17, 15, 0, 5, '2026-09-12 03:18:34'),
  (24, 16, NULL, 15, 0, 5, '2026-09-12 03:18:34'),
  (25, 17, NULL, 60, 0, 10, '2026-09-12 03:18:34'),
  (26, 18, NULL, 100, 0, 15, '2026-09-12 03:18:34')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: coupons (2 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `usage_count`, `per_user_limit`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 'WELCOME10', '10% discount on first order above Rs 500', 'percentage', '10.00', '500.00', '300.00', 1000, 0, 1, '2025-12-31 18:30:00', '2027-12-31 18:29:59', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, 'FLAT200', 'Flat Rs 200 discount on orders above Rs 1200', 'fixed', '200.00', '1200.00', '200.00', 500, 0, 1, '2025-12-31 18:30:00', '2027-12-31 18:29:59', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: carts (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `carts` (`id`, `user_id`, `session_id`, `created_at`, `updated_at`)
VALUES
  (1, 1, NULL, '2026-09-11 14:35:29', '2026-09-11 14:35:29'),
  (2, 6, NULL, '2026-09-11 14:44:01', '2026-09-11 14:44:01'),
  (3, 5, NULL, '2026-09-11 15:47:55', '2026-09-11 15:47:55')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: cart_items (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `variant_id`, `quantity`, `created_at`, `updated_at`)
VALUES
  (5, 2, 1, 1, 2, '2026-09-11 14:44:01', '2026-09-11 14:44:01'),
  (9, 3, 4, NULL, 1, '2026-09-11 15:50:06', '2026-09-11 15:50:06'),
  (10, 3, 3, NULL, 1, '2026-09-11 15:50:29', '2026-09-11 15:50:29')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: orders (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `shipping_address_id`, `billing_address_id`, `coupon_id`, `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `total_amount`, `order_status`, `payment_method`, `payment_status`, `notes`, `created_at`, `updated_at`, `shipping_full_name`, `shipping_phone`, `shipping_address_line1`, `shipping_address_line2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`)
VALUES
  (1, 'ORD-1789140677016-3910', 1, 2, 2, NULL, '2499.00', '0.00', '0.00', '0.00', '2499.00', 'pending', 'cod', 'pending', 'Please call before delivery', '2026-09-11 15:31:17', '2026-09-11 15:31:17', 'Demo Customer', '+91 9876543210', 'Flat 402, Sunshine Apartments', 'MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'India'),
  (2, 'ORD-1789140677572-2716', 1, 2, 2, NULL, '1499.00', '0.00', '0.00', '0.00', '1499.00', 'pending', 'cod', 'pending', NULL, '2026-09-11 15:31:17', '2026-09-11 15:31:17', 'Demo Customer', '+91 9876543210', 'Flat 402, Sunshine Apartments', 'MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'India'),
  (3, 'ORD-1789141737177-8601', 5, 3, 3, NULL, '499.00', '0.00', '0.00', '50.00', '549.00', 'confirmed', 'cod', 'pending', NULL, '2026-09-11 15:48:57', '2026-09-11 15:54:12', 'Lahari Tummala', '987654321', 'Near ramalayam temple chekkapalli', NULL, 'Nuzvid', 'Andhra Pradesh', '521202', 'India')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: order_items (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `variant_id`, `product_name`, `variant_name`, `unit_price`, `quantity`, `total_price`, `created_at`)
VALUES
  (1, 1, 1, 1, 'Wireless Active Noise-Cancelling Headphones', 'Matte Black', '2499.00', 1, '2499.00', '2026-09-11 15:31:17'),
  (2, 2, 4, NULL, 'Cold Brew Artisan Glass Coffee Maker', NULL, '1499.00', 1, '1499.00', '2026-09-11 15:31:17'),
  (3, 3, 6, NULL, 'Full-Stack Architecture & Engineering Playbook', NULL, '499.00', 1, '499.00', '2026-09-11 15:48:57')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: payments (3 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `payments` (`id`, `order_id`, `payment_method`, `transaction_reference`, `amount`, `currency`, `payment_status`, `payment_gateway_response`, `paid_at`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'cod', NULL, '2499.00', 'INR', 'pending', NULL, NULL, '2026-09-11 15:31:17', '2026-09-11 15:31:17'),
  (2, 2, 'cod', NULL, '1499.00', 'INR', 'pending', NULL, NULL, '2026-09-11 15:31:17', '2026-09-11 15:31:17'),
  (3, 3, 'cod', NULL, '549.00', 'INR', 'pending', NULL, NULL, '2026-09-11 15:48:57', '2026-09-11 15:48:57')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: order_status_history (4 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `comment`, `changed_by`, `created_at`)
VALUES
  (1, 1, 'pending', 'Order placed successfully by customer via Cash on Delivery', NULL, '2026-09-11 15:31:17'),
  (2, 2, 'pending', 'Order placed successfully by customer via Cash on Delivery', NULL, '2026-09-11 15:31:17'),
  (3, 3, 'pending', 'Order placed successfully by customer via Cash on Delivery', NULL, '2026-09-11 15:48:57'),
  (4, 3, 'confirmed', 'Order verified and confirmed by operations team', 2, '2026-09-11 15:54:12')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: wishlists (4 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `wishlists` (`id`, `user_id`, `created_at`, `updated_at`)
VALUES
  (1, 1, '2026-09-11 16:18:11', '2026-09-11 16:18:11'),
  (2, 9, '2026-09-11 16:19:05', '2026-09-11 16:19:05'),
  (3, 10, '2026-09-12 03:00:28', '2026-09-12 03:00:28'),
  (4, 2, '2026-09-12 03:03:47', '2026-09-12 03:03:47')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: wishlist_items (2 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `wishlist_items` (`id`, `wishlist_id`, `product_id`, `created_at`)
VALUES
  (8, 2, 6, '2026-09-11 16:26:14'),
  (9, 3, 4, '2026-09-12 03:01:36')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- Data for: product_reviews (1 rows)
-- ----------------------------------------------------------------------------
INSERT INTO `product_reviews` (`id`, `product_id`, `user_id`, `rating`, `review_title`, `review_text`, `is_active`, `created_at`, `updated_at`)
VALUES
  (3, 4, 10, 5, NULL, 'they are good and fresh', 0, '2026-09-12 03:03:14', '2026-09-12 03:05:08')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after executing the script to verify your cloud database:
-- SHOW TABLES;
-- SELECT COUNT(*) AS products_count FROM products;
-- SELECT COUNT(*) AS categories_count FROM categories;
-- SELECT COUNT(*) AS users_count FROM users;
-- SELECT COUNT(*) AS orders_count FROM orders;
-- SELECT COUNT(*) AS reviews_count FROM product_reviews;
-- SELECT COUNT(*) AS wishlist_items_count FROM wishlist_items;
