-- ============================================================================
-- Shop Express - Seed Data (Development & Demo Only)
-- Version: 1.0.0
-- CAUTION: Safe mock records only. Never use demo passwords in production.
-- ============================================================================

USE `shop_express`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. SEED ROLES
-- ----------------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'customer', 'Standard registered customer with storefront access'),
(2, 'admin', 'Administrative user with full catalog and order management access')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- ----------------------------------------------------------------------------
-- 2. SEED USERS
-- Password for demo accounts: "password123" (hashed with bcrypt cost 10)
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `is_active`) VALUES
(1, 1, 'Demo', 'Customer', 'demo.customer@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', '+919876543210', TRUE),
(2, 2, 'Demo', 'Admin', 'demo.admin@shopexpress.test', '$2a$10$wT6oB5Kk1j7oGZ8rJc1l.e8wZ3o9vQfR9/wLg7q4y.o8zR8Q2hW.e', '+919876543211', TRUE)
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`);

-- ----------------------------------------------------------------------------
-- 3. SEED ADDRESSES
-- ----------------------------------------------------------------------------
INSERT INTO `addresses` (`id`, `user_id`, `address_type`, `is_default`, `full_name`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`) VALUES
(1, 1, 'both', TRUE, 'Demo Customer', '+919876543210', '101 Innovation Park', 'Koramangala 5th Block', 'Bengaluru', 'Karnataka', '560095', 'India')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ----------------------------------------------------------------------------
-- 4. SEED CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `is_active`) VALUES
(1, NULL, 'Electronics', 'electronics', 'Audio, wearable tech, peripherals, and smart devices', TRUE),
(2, NULL, 'Fashion', 'fashion', 'Apparel, footwear, and lifestyle accessories', TRUE),
(3, NULL, 'Home & Kitchen', 'home-kitchen', 'Cookware, appliances, and home essentials', TRUE),
(4, NULL, 'Sports & Fitness', 'sports-fitness', 'Workout gear, sporting equipment, and accessories', TRUE),
(5, NULL, 'Books & Stationery', 'books-stationery', 'Educational, fiction, and professional literature', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ----------------------------------------------------------------------------
-- 5. SEED PRODUCTS
-- ----------------------------------------------------------------------------
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, `base_price`, `discount_price`, `is_featured`, `is_active`) VALUES
(1, 1, 'Wireless Active Noise-Cancelling Headphones', 'wireless-anc-headphones', 'SKU-ELEC-001', 'High-fidelity audio with 40-hour battery life and hybrid ANC.', 'Experience studio-quality sound anywhere with these over-ear headphones featuring active noise cancellation, custom 40mm drivers, multipoint Bluetooth connectivity, and an ergonomic memory foam headband.', 2999.00, 2499.00, TRUE, TRUE),
(2, 1, 'Smart AMOLED Fitness Tracker', 'smart-amoled-fitness-tracker', 'SKU-ELEC-002', 'Vibrant 1.4-inch display with heart-rate and SpO2 tracking.', 'Track all your daily metrics effortlessly. Features 5ATM water resistance, all-day heart rate monitoring, sleep analysis, and over 60 sports modes.', 3999.00, 3499.00, TRUE, TRUE),
(3, 2, 'Classic Organic Cotton Crewneck T-Shirt', 'classic-organic-cotton-tshirt', 'SKU-FASH-001', '100% combed ringspun organic cotton for everyday comfort.', 'A wardrobe staple crafted from sustainably sourced 180 GSM combed cotton. Pre-shrunk, breathable, and reinforced with double-stitched hems.', 799.00, 599.00, FALSE, TRUE),
(4, 3, 'Cold Brew Artisan Glass Coffee Maker', 'cold-brew-glass-coffee-maker', 'SKU-HOME-001', 'BPA-free borosilicate glass carafe with fine stainless steel filter.', 'Make smooth, low-acidity cold brew right in your refrigerator. Heavy-duty borosilicate glass with laser-cut stainless steel mesh infuser.', 1899.00, 1499.00, TRUE, TRUE),
(5, 4, 'Pro-Grip High-Density Alignment Yoga Mat', 'pro-grip-alignment-yoga-mat', 'SKU-SPRT-001', 'Non-slip eco-friendly TPE surface with laser-etched posture lines.', 'Engineered for yogis of all levels. Provides 6mm of supportive cushioning, exceptional dual-sided grip, and laser-engraved central alignment guides.', 1299.00, 999.00, FALSE, TRUE),
(6, 5, 'Full-Stack Architecture & Engineering Playbook', 'full-stack-architecture-playbook', 'SKU-BOOK-001', 'Comprehensive blueprint for designing scalable modern web systems.', 'An essential desktop companion for developers covering microservices, relational database schema optimization, caching patterns, and API architecture.', 699.00, 499.00, TRUE, TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ----------------------------------------------------------------------------
-- 6. SEED PRODUCT VARIANTS
-- ----------------------------------------------------------------------------
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`) VALUES
(1, 1, 'SKU-ELEC-001-BLK', 'Matte Black', 0.00, TRUE),
(2, 1, 'SKU-ELEC-001-SLV', 'Silver White', 0.00, TRUE),
(3, 2, 'SKU-ELEC-002-BLU', 'Navy Blue Band', 0.00, TRUE),
(4, 3, 'SKU-FASH-001-M-BLK', 'Size: M / Black', 0.00, TRUE),
(5, 3, 'SKU-FASH-001-L-BLK', 'Size: L / Black', 0.00, TRUE),
(6, 4, 'SKU-HOME-001-1L', '1000ml Standard', 0.00, TRUE),
(7, 5, 'SKU-SPRT-001-TEAL', '6mm / Deep Teal', 0.00, TRUE),
(8, 6, 'SKU-BOOK-001-HC', 'Hardcover Edition', 0.00, TRUE)
ON DUPLICATE KEY UPDATE `variant_name` = VALUES(`variant_name`);

-- ----------------------------------------------------------------------------
-- 7. SEED PRODUCT IMAGES
-- ----------------------------------------------------------------------------
INSERT INTO `product_images` (`id`, `product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`) VALUES
(1, 1, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', 'Matte Black Noise Cancelling Headphones', TRUE, 1),
(2, 2, 3, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Smart Fitness Tracker Display', TRUE, 1),
(3, 3, 4, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80', 'Classic Black Cotton T-Shirt', TRUE, 1),
(4, 4, 6, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80', 'Glass Cold Brew Coffee Maker', TRUE, 1),
(5, 5, 7, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80', 'Non-Slip Alignment Yoga Mat', TRUE, 1),
(6, 6, 8, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80', 'Full-Stack Architecture Book Cover', TRUE, 1)
ON DUPLICATE KEY UPDATE `image_url` = VALUES(`image_url`);

-- ----------------------------------------------------------------------------
-- 8. SEED INVENTORY
-- ----------------------------------------------------------------------------
INSERT INTO `inventory` (`id`, `product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`) VALUES
(1, 1, 1, 40, 0, 5),
(2, 1, 2, 25, 0, 5),
(3, 2, 3, 35, 0, 5),
(4, 3, 4, 50, 0, 10),
(5, 3, 5, 45, 0, 10),
(6, 4, 6, 30, 0, 5),
(7, 5, 7, 60, 0, 8),
(8, 6, 8, 100, 0, 15)
ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`);

-- ----------------------------------------------------------------------------
-- 9. SEED COUPONS
-- ----------------------------------------------------------------------------
INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `usage_count`, `per_user_limit`, `start_date`, `end_date`, `is_active`) VALUES
(1, 'WELCOME10', '10% discount on first order above Rs 500', 'percentage', 10.00, 500.00, 300.00, 1000, 0, 1, '2026-01-01 00:00:00', '2027-12-31 23:59:59', TRUE),
(2, 'FLAT200', 'Flat Rs 200 discount on orders above Rs 1200', 'fixed', 200.00, 1200.00, 200.00, 500, 0, 1, '2026-01-01 00:00:00', '2027-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

SET FOREIGN_KEY_CHECKS = 1;
