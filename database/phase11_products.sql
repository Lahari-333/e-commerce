-- ============================================================================
-- Shop Express - Phase 11 Sample Products Seed Script
-- Safe, Idempotent, Parameter-Safe SQL Migration
-- Database: shop_express
-- ============================================================================

USE `shop_express`;

START TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. Portable Bluetooth Speaker
-- Category: Electronics | SKU: SPK-BLU-001
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Portable Bluetooth Speaker',
  'portable-bluetooth-speaker',
  'SPK-BLU-001',
  'Compact wireless Bluetooth speaker with rich sound, deep bass, water resistance, and 12-hour battery.',
  'Compact wireless Bluetooth speaker with rich sound, deep bass, water resistance, and up to 12 hours of battery life.',
  1999.00,
  1499.00,
  TRUE,
  TRUE
FROM `categories` c
WHERE c.name = 'Electronics'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'SPK-BLU-001' OR `slug` = 'portable-bluetooth-speaker'
  )
LIMIT 1;

-- Images
INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80', 
  'Portable Bluetooth Speaker', TRUE, 1
FROM `products` p
WHERE p.sku = 'SPK-BLU-001'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

-- Variants (Black and Blue)
INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SPK-BLU-001-BLK', 'Matte Black', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SPK-BLU-001'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SPK-BLU-001-BLK');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SPK-BLU-001-BLU', 'Ocean Blue', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SPK-BLU-001'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SPK-BLU-001-BLU');

-- Inventory for Variants (15 units each = 30 total)
INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 15, 0, 5
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SPK-BLU-001' AND pv.sku = 'SPK-BLU-001-BLK'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 15, 0, 5
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SPK-BLU-001' AND pv.sku = 'SPK-BLU-001-BLU'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);


-- ----------------------------------------------------------------------------
-- 2. RGB Mechanical Gaming Keyboard
-- Category: Electronics | SKU: KEY-RGB-002
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'RGB Mechanical Gaming Keyboard',
  'rgb-mechanical-gaming-keyboard',
  'KEY-RGB-002',
  'High-performance mechanical gaming keyboard with RGB backlighting, tactile switches, and anti-ghosting.',
  'High-performance mechanical gaming keyboard with RGB backlighting, tactile switches, anti-ghosting, and a durable compact design.',
  3499.00,
  2799.00,
  TRUE,
  TRUE
FROM `categories` c
WHERE c.name = 'Electronics'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'KEY-RGB-002' OR `slug` = 'rgb-mechanical-gaming-keyboard'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 
  'RGB Mechanical Gaming Keyboard', TRUE, 1
FROM `products` p
WHERE p.sku = 'KEY-RGB-002'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 20, 0, 5
FROM `products` p
WHERE p.sku = 'KEY-RGB-002'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 3. Minimalist Laptop Backpack
-- Category: Fashion | SKU: BAG-LAP-003
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Minimalist Laptop Backpack',
  'minimalist-laptop-backpack',
  'BAG-LAP-003',
  'Water-resistant laptop backpack with padded compartments and comfortable ergonomic design.',
  'Water-resistant laptop backpack with padded compartments, multiple storage pockets, and a comfortable design for college, work, and travel.',
  1699.00,
  1199.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Fashion'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'BAG-LAP-003' OR `slug` = 'minimalist-laptop-backpack'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', 
  'Minimalist Laptop Backpack', TRUE, 1
FROM `products` p
WHERE p.sku = 'BAG-LAP-003'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 40, 0, 10
FROM `products` p
WHERE p.sku = 'BAG-LAP-003'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 4. Lightweight Premium Running Shoes
-- Category: Fashion | SKU: SHO-RUN-004
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Lightweight Premium Running Shoes',
  'lightweight-premium-running-shoes',
  'SHO-RUN-004',
  'Lightweight running shoes with breathable mesh, cushioned soles, and flexible support.',
  'Lightweight running shoes with breathable mesh, cushioned soles, flexible support, and a comfortable fit for daily workouts.',
  3199.00,
  2299.00,
  TRUE,
  TRUE
FROM `categories` c
WHERE c.name = 'Fashion'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'SHO-RUN-004' OR `slug` = 'lightweight-premium-running-shoes'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 
  'Lightweight Premium Running Shoes', TRUE, 1
FROM `products` p
WHERE p.sku = 'SHO-RUN-004'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

-- Variants (Sizes 7, 8, 9, 10)
INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SHO-RUN-004-7', 'Size 7 UK/IN', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SHO-RUN-004'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SHO-RUN-004-7');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SHO-RUN-004-8', 'Size 8 UK/IN', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SHO-RUN-004'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SHO-RUN-004-8');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SHO-RUN-004-9', 'Size 9 UK/IN', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SHO-RUN-004'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SHO-RUN-004-9');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'SHO-RUN-004-10', 'Size 10 UK/IN', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'SHO-RUN-004'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'SHO-RUN-004-10');

-- Inventory for shoe sizes (6, 7, 6, 6 = 25 total)
INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 6, 0, 3
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SHO-RUN-004' AND pv.sku = 'SHO-RUN-004-7'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 7, 0, 3
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SHO-RUN-004' AND pv.sku = 'SHO-RUN-004-8'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 6, 0, 3
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SHO-RUN-004' AND pv.sku = 'SHO-RUN-004-9'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 6, 0, 3
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'SHO-RUN-004' AND pv.sku = 'SHO-RUN-004-10'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);


-- ----------------------------------------------------------------------------
-- 5. Ceramic Coffee Mug Set of 2
-- Category: Home & Kitchen | SKU: MUG-CER-005
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Ceramic Coffee Mug Set of 2',
  'ceramic-coffee-mug-set-of-2',
  'MUG-CER-005',
  'Elegant ceramic coffee mug set with smooth finish and comfortable handles for home or office.',
  'Elegant ceramic coffee mug set with a smooth finish, comfortable handles, and a modern design suitable for home or office use.',
  899.00,
  599.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Home & Kitchen'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'MUG-CER-005' OR `slug` = 'ceramic-coffee-mug-set-of-2'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80', 
  'Ceramic Coffee Mug Set of 2', TRUE, 1
FROM `products` p
WHERE p.sku = 'MUG-CER-005'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 50, 0, 10
FROM `products` p
WHERE p.sku = 'MUG-CER-005'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 6. Adjustable Smart LED Desk Lamp
-- Category: Home & Kitchen | SKU: LMP-LED-006
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Adjustable Smart LED Desk Lamp',
  'adjustable-smart-led-desk-lamp',
  'LMP-LED-006',
  'Adjustable LED desk lamp with multiple brightness levels, flexible neck, and energy-efficient lighting.',
  'Adjustable LED desk lamp with multiple brightness levels, flexible neck, energy-efficient lighting, and a modern minimalist design.',
  1299.00,
  899.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Home & Kitchen'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'LMP-LED-006' OR `slug` = 'adjustable-smart-led-desk-lamp'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', 
  'Adjustable Smart LED Desk Lamp', TRUE, 1
FROM `products` p
WHERE p.sku = 'LMP-LED-006'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 35, 0, 5
FROM `products` p
WHERE p.sku = 'LMP-LED-006'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 7. Insulated Stainless Steel Water Bottle
-- Category: Sports & Fitness | SKU: BOT-INS-007
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Insulated Stainless Steel Water Bottle',
  'insulated-stainless-steel-water-bottle',
  'BOT-INS-007',
  'Double-wall insulated stainless steel water bottle keeping drinks cold or hot for hours.',
  'Double-wall insulated stainless steel water bottle that keeps beverages cold or hot for hours. Leak-resistant and easy to carry.',
  999.00,
  749.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Sports & Fitness'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'BOT-INS-007' OR `slug` = 'insulated-stainless-steel-water-bottle'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80', 
  'Insulated Stainless Steel Water Bottle', TRUE, 1
FROM `products` p
WHERE p.sku = 'BOT-INS-007'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

-- Variants (500 ml, 750 ml, 1 Litre)
INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'BOT-INS-007-500ML', '500 ml', 0.00, TRUE
FROM `products` p
WHERE p.sku = 'BOT-INS-007'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'BOT-INS-007-500ML');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'BOT-INS-007-750ML', '750 ml', 50.00, TRUE
FROM `products` p
WHERE p.sku = 'BOT-INS-007'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'BOT-INS-007-750ML');

INSERT INTO `product_variants` (`product_id`, `sku`, `variant_name`, `price_modifier`, `is_active`)
SELECT p.id, 'BOT-INS-007-1L', '1 Litre', 100.00, TRUE
FROM `products` p
WHERE p.sku = 'BOT-INS-007'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` WHERE `sku` = 'BOT-INS-007-1L');

-- Inventory for bottle sizes (15 units each = 45 total)
INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 15, 0, 5
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'BOT-INS-007' AND pv.sku = 'BOT-INS-007-500ML'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 15, 0, 5
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'BOT-INS-007' AND pv.sku = 'BOT-INS-007-750ML'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, pv.id, 15, 0, 5
FROM `products` p
JOIN `product_variants` pv ON pv.product_id = p.id
WHERE p.sku = 'BOT-INS-007' AND pv.sku = 'BOT-INS-007-1L'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` = pv.id);


-- ----------------------------------------------------------------------------
-- 8. Adjustable Dumbbell Set
-- Category: Sports & Fitness | SKU: DUM-ADJ-008
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Adjustable Dumbbell Set',
  'adjustable-dumbbell-set',
  'DUM-ADJ-008',
  'Adjustable dumbbell set for home workouts and strength training with quick-change weight settings.',
  'Adjustable dumbbell set designed for home workouts, strength training, and muscle conditioning with easy-to-change weight settings.',
  3499.00,
  2499.00,
  TRUE,
  TRUE
FROM `categories` c
WHERE c.name = 'Sports & Fitness'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'DUM-ADJ-008' OR `slug` = 'adjustable-dumbbell-set'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', 
  'Adjustable Dumbbell Set', TRUE, 1
FROM `products` p
WHERE p.sku = 'DUM-ADJ-008'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 15, 0, 5
FROM `products` p
WHERE p.sku = 'DUM-ADJ-008'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 9. Daily Productivity Planner
-- Category: Books & Stationery | SKU: PLN-DAY-009
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Daily Productivity Planner',
  'daily-productivity-planner',
  'PLN-DAY-009',
  'Undated daily planner with goal setting, habit tracking, and task priority sections.',
  'Undated productivity planner with daily goals, task lists, habit tracking, notes, and reflection sections to organize your day effectively.',
  599.00,
  399.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Books & Stationery'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'PLN-DAY-009' OR `slug` = 'daily-productivity-planner'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80', 
  'Daily Productivity Planner', TRUE, 1
FROM `products` p
WHERE p.sku = 'PLN-DAY-009'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 60, 0, 10
FROM `products` p
WHERE p.sku = 'PLN-DAY-009'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);


-- ----------------------------------------------------------------------------
-- 10. Premium Ballpoint Pen Set
-- Category: Books & Stationery | SKU: PEN-BAL-010
-- ----------------------------------------------------------------------------
INSERT INTO `products` (
  `category_id`, `name`, `slug`, `sku`, `short_description`, `description`, 
  `base_price`, `discount_price`, `is_featured`, `is_active`
)
SELECT 
  c.id,
  'Premium Ballpoint Pen Set',
  'premium-ballpoint-pen-set',
  'PEN-BAL-010',
  'Smooth-writing ballpoint pen set with comfortable grip, quick-drying ink, and modern metallic design.',
  'Smooth-writing premium ballpoint pen set with comfortable grip, quick-drying ink, and elegant design for school, college, and office use.',
  449.00,
  299.00,
  FALSE,
  TRUE
FROM `categories` c
WHERE c.name = 'Books & Stationery'
  AND NOT EXISTS (
    SELECT 1 FROM `products` WHERE `sku` = 'PEN-BAL-010' OR `slug` = 'premium-ballpoint-pen-set'
  )
LIMIT 1;

INSERT INTO `product_images` (`product_id`, `variant_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`)
SELECT 
  p.id, NULL, 
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80', 
  'Premium Ballpoint Pen Set', TRUE, 1
FROM `products` p
WHERE p.sku = 'PEN-BAL-010'
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO `inventory` (`product_id`, `variant_id`, `quantity`, `reserved_quantity`, `low_stock_threshold`)
SELECT p.id, NULL, 100, 0, 15
FROM `products` p
WHERE p.sku = 'PEN-BAL-010'
  AND NOT EXISTS (SELECT 1 FROM `inventory` WHERE `product_id` = p.id AND `variant_id` IS NULL);

COMMIT;
