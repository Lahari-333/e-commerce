-- ============================================================================
-- Shop Express - TiDB Cloud Seed Data Migration
-- Target Database: shop_express
-- Dialect: MySQL 8.0 / TiDB Cloud Compatible
-- Strategy: Strict foreign-key order, INSERT IGNORE (idempotent, safe to rerun)
-- Note:
--   - No CREATE DATABASE or DROP statements
--   - No SET FOREIGN_KEY_CHECKS required (validated dependency order)
--   - Test orders & carts excluded
--   - User accounts set to demo password hash: 'password123'
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION: ROLES (2 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `created_at`)
VALUES
  (1, 'customer', 'Standard registered customer with storefront access', '2026-09-11 13:32:41'),
  (2, 'admin', 'Administrative user with full catalog and order management access', '2026-09-11 13:32:41');

-- ----------------------------------------------------------------------------
-- SECTION: USERS (10 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `is_active`, `created_at`, `updated_at`)
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
  (10, 1, 'pravallika', '', 'pravallika@gmail.com', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', NULL, 1, '2026-09-12 03:00:27', '2026-09-12 03:00:27');

-- ----------------------------------------------------------------------------
-- SECTION: ADDRESSES (3 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `addresses` (`id`, `user_id`, `address_type`, `is_default`, `full_name`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'both', 0, 'Demo Customer', '+919876543210', '101 Innovation Park', 'Koramangala 5th Block', 'Bengaluru', 'Karnataka', '560095', 'India', '2026-09-11 13:32:41', '2026-09-11 15:31:16'),
  (2, 1, 'shipping', 1, 'Demo Customer', '+91 9876543210', 'Flat 402, Sunshine Apartments', 'MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'India', '2026-09-11 15:31:16', '2026-09-11 15:31:16'),
  (3, 5, 'shipping', 1, 'Lahari Tummala', '987654321', 'Near ramalayam temple chekkapalli', NULL, 'Nuzvid', 'Andhra Pradesh', '521202', 'India', '2026-09-11 15:48:34', '2026-09-11 15:48:34');

-- ----------------------------------------------------------------------------
-- SECTION: CATEGORIES (5 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, NULL, 'Electronics', 'electronics', 'Audio, wearable tech, peripherals, and smart devices', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, NULL, 'Fashion', 'fashion', 'Apparel, footwear, and lifestyle accessories', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (3, NULL, 'Home & Kitchen', 'home-kitchen', 'Cookware, appliances, and home essentials', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (4, NULL, 'Sports & Fitness', 'sports-fitness', 'Workout gear, sporting equipment, and accessories', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (5, NULL, 'Books & Stationery', 'books-stationery', 'Educational, fiction, and professional literature', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41');

-- ----------------------------------------------------------------------------
-- SECTION: COUPONS (2 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `usage_count`, `per_user_limit`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 'WELCOME10', '10% discount on first order above Rs 500', 'percentage', '10.00', '500.00', '300.00', 1000, 0, 1, '2025-12-31 18:30:00', '2027-12-31 18:29:59', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41'),
  (2, 'FLAT200', 'Flat Rs 200 discount on orders above Rs 1200', 'fixed', '200.00', '1200.00', '200.00', 500, 0, 1, '2025-12-31 18:30:00', '2027-12-31 18:29:59', 1, '2026-09-11 13:32:41', '2026-09-11 13:32:41');

-- ----------------------------------------------------------------------------
-- SECTION: PRODUCTS (18 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `products` (`id`, `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, `base_price`, `discount_price`, `is_featured`, `is_active`, `created_at`, `updated_at`)
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
  (18, 5, 'Premium Ballpoint Pen Set', 'premium-ballpoint-pen-set', 'PEN-BAL-010', 'Smooth-writing ballpoint pen set with comfortable grip, quick-drying ink, and modern metallic design.', 'Smooth-writing premium ballpoint pen set with comfortable grip, quick-drying ink, and elegant design for school, college, and office use.', '449.00', '299.00', 0, 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34');

-- ----------------------------------------------------------------------------
-- SECTION: PRODUCT_VARIANTS (17 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`, `created_at`, `updated_at`)
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
  (17, 15, 'BOT-INS-007-1L', '1 Litre', '100.00', 1, '2026-09-12 03:18:34', '2026-09-12 03:18:34');

-- ----------------------------------------------------------------------------
-- SECTION: PRODUCT_IMAGES (18 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `product_images` (`id`, `product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`, `created_at`)
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
  (18, 18, NULL, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80', 'Premium Ballpoint Pen Set', 1, 1, '2026-09-12 03:18:34');

-- ----------------------------------------------------------------------------
-- SECTION: INVENTORY (26 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `inventory` (`id`, `product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`, `updated_at`)
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
  (26, 18, NULL, 100, 0, 15, '2026-09-12 03:18:34');

-- ----------------------------------------------------------------------------
-- SECTION: WISHLISTS (4 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `wishlists` (`id`, `user_id`, `created_at`, `updated_at`)
VALUES
  (1, 1, '2026-09-11 16:18:11', '2026-09-11 16:18:11'),
  (2, 9, '2026-09-11 16:19:05', '2026-09-11 16:19:05'),
  (3, 10, '2026-09-12 03:00:28', '2026-09-12 03:00:28'),
  (4, 2, '2026-09-12 03:03:47', '2026-09-12 03:03:47');

-- ----------------------------------------------------------------------------
-- SECTION: WISHLIST_ITEMS (2 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `wishlist_items` (`id`, `wishlist_id`, `product_id`, `created_at`)
VALUES
  (8, 2, 6, '2026-09-11 16:26:14'),
  (9, 3, 4, '2026-09-12 03:01:36');

-- ----------------------------------------------------------------------------
-- SECTION: PRODUCT_REVIEWS (1 rows)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `product_reviews` (`id`, `product_id`, `user_id`, `rating`, `review_title`, `review_text`, `is_active`, `created_at`, `updated_at`)
VALUES
  (3, 4, 10, 5, NULL, 'they are good and fresh', 1, '2026-09-12 03:03:14', '2026-09-12 03:05:08');

