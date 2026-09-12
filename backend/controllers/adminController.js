const db = require("../config/db");

// ============================================================================
// A. DASHBOARD STATS
// ============================================================================

/**
 * GET /api/admin/dashboard/stats
 * Overview analytics for the admin dashboard
 */
async function getDashboardStats(req, res) {
  try {
    // 1. Total users and customers
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN r.name = 'customer' THEN 1 ELSE 0 END) AS total_customers,
        SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) AS total_admins
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);

    // 2. Product counts
    const [productStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active_products
      FROM products
    `);

    // 3. Order counts and revenue
    const [orderStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders,
        SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) AS shipped_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS total_revenue
      FROM orders
    `);

    // 4. Low stock products count
    const [inventoryStats] = await db.query(`
      SELECT COUNT(DISTINCT product_id) AS low_stock_count
      FROM inventory
      WHERE (quantity - reserved_quantity) <= low_stock_threshold
    `);

    // 5. Recent 5 orders preview
    const [recentOrders] = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.order_status AS status,
        o.payment_method,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        total_users: Number(userStats[0].total_users || 0),
        total_customers: Number(userStats[0].total_customers || 0),
        total_admins: Number(userStats[0].total_admins || 0),
        total_products: Number(productStats[0].total_products || 0),
        active_products: Number(productStats[0].active_products || 0),
        total_orders: Number(orderStats[0].total_orders || 0),
        pending_orders: Number(orderStats[0].pending_orders || 0),
        confirmed_orders: Number(orderStats[0].confirmed_orders || 0),
        shipped_orders: Number(orderStats[0].shipped_orders || 0),
        delivered_orders: Number(orderStats[0].delivered_orders || 0),
        cancelled_orders: Number(orderStats[0].cancelled_orders || 0),
        total_revenue: Number(Number(orderStats[0].total_revenue || 0).toFixed(2)),
        low_stock_count: Number(inventoryStats[0].low_stock_count || 0),
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard analytics"
    });
  }
}

// ============================================================================
// B. PRODUCT MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/products
 * List all products (active and inactive) with category and stock info
 */
async function getAdminProducts(req, res) {
  try {
    const { search, category, status } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.base_price,
        p.discount_price,
        p.is_active,
        p.is_featured,
        p.category_id,
        c.name AS category_name,
        COALESCE(
          (
            SELECT pi.image_url 
            FROM product_images pi 
            WHERE pi.product_id = p.id 
            ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
            LIMIT 1
          ),
          ''
        ) AS primary_image,
        COALESCE(
          (
            SELECT SUM(i.quantity - i.reserved_quantity) 
            FROM inventory i 
            WHERE i.product_id = p.id
          ),
          0
        ) AS current_stock,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.slug LIKE ?)`;
      params.push(term, term, term);
    }

    if (category) {
      query += ` AND (p.category_id = ? OR c.slug = ?)`;
      params.push(category, category);
    }

    if (status === "active") {
      query += ` AND p.is_active = TRUE`;
    } else if (status === "inactive") {
      query += ` AND p.is_active = FALSE`;
    }

    query += ` ORDER BY p.id DESC`;

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        base_price: Number(r.base_price),
        discount_price: r.discount_price !== null ? Number(r.discount_price) : null,
        current_stock: Number(r.current_stock)
      }))
    });
  } catch (error) {
    console.error("Admin getProducts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products catalog"
    });
  }
}

/**
 * GET /api/admin/products/:id
 * Retrieve a single product for viewing or editing
 */
async function getAdminProductById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid product ID is required" });
    }

    const [prodRows] = await db.query(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ? LIMIT 1`,
      [id]
    );

    if (prodRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = prodRows[0];

    // Fetch images
    const [images] = await db.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC`,
      [id]
    );

    // Fetch variants
    const [variants] = await db.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
      [id]
    );

    // Fetch inventory
    const [inventory] = await db.query(
      `SELECT * FROM inventory WHERE product_id = ?`,
      [id]
    );

    const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url || "";
    const totalStock = inventory.reduce((acc, curr) => acc + (curr.quantity - curr.reserved_quantity), 0);

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        base_price: Number(product.base_price),
        discount_price: product.discount_price !== null ? Number(product.discount_price) : null,
        primary_image: primaryImage,
        current_stock: totalStock,
        images,
        variants,
        inventory
      }
    });
  } catch (error) {
    console.error("Admin getProductById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details"
    });
  }
}

/**
 * POST /api/admin/products
 * Create a new product with stock and image
 */
async function createAdminProduct(req, res) {
  try {
    const {
      name,
      slug,
      sku,
      short_description,
      description,
      base_price,
      discount_price,
      category_id,
      is_featured = false,
      is_active = true,
      stock = 10,
      image_url = ""
    } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    const price = parseFloat(base_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: "A valid non-negative base price is required" });
    }

    const catId = parseInt(category_id, 10);
    if (!catId || isNaN(catId)) {
      return res.status(400).json({ success: false, message: "A valid category ID is required" });
    }

    // Generate slug if empty
    const cleanSlug = (slug && slug.trim() !== "")
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // Check slug uniqueness
    const [slugRows] = await db.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [cleanSlug]);
    if (slugRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A product with this slug URL already exists. Please choose a unique slug."
      });
    }

    // SKU generation if missing
    const cleanSku = (sku && sku.trim() !== "")
      ? sku.trim().toUpperCase()
      : `SKU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const [skuRows] = await db.query("SELECT id FROM products WHERE sku = ? LIMIT 1", [cleanSku]);
    if (skuRows.length > 0) {
      return res.status(400).json({ success: false, message: "A product with this SKU already exists" });
    }

    const discPrice = (discount_price !== undefined && discount_price !== null && discount_price !== "")
      ? parseFloat(discount_price)
      : null;

    // 2. Insert into products
    const insertQuery = `
      INSERT INTO products (
        category_id,
        name,
        slug,
        sku,
        short_description,
        description,
        base_price,
        discount_price,
        is_featured,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [prodResult] = await db.query(insertQuery, [
      catId,
      name.trim(),
      cleanSlug,
      cleanSku,
      short_description ? short_description.trim() : null,
      description ? description.trim() : null,
      price,
      discPrice,
      is_featured ? 1 : 0,
      is_active ? 1 : 0
    ]);

    const newProductId = prodResult.insertId;

    // 3. Create initial inventory record
    const initialQty = parseInt(stock, 10);
    const validQty = (!isNaN(initialQty) && initialQty >= 0) ? initialQty : 0;

    await db.query(
      `INSERT INTO inventory (product_id, variant_id, quantity, low_stock_threshold) VALUES (?, NULL, ?, 5)`,
      [newProductId, validQty]
    );

    // 4. Create primary image record if provided
    if (image_url && image_url.trim() !== "") {
      await db.query(
        `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, 1, 1)`,
        [newProductId, image_url.trim(), name.trim()]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        id: newProductId,
        name: name.trim(),
        slug: cleanSlug,
        sku: cleanSku,
        base_price: price,
        discount_price: discPrice,
        is_active: Boolean(is_active)
      }
    });
  } catch (error) {
    console.error("Admin createProduct error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create product"
    });
  }
}

/**
 * PATCH /api/admin/products/:id
 * Update an existing product
 */
async function updateAdminProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid product ID is required" });
    }

    const [existing] = await db.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const {
      name,
      slug,
      sku,
      short_description,
      description,
      base_price,
      discount_price,
      category_id,
      is_featured,
      is_active,
      stock,
      image_url
    } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }

    if (slug !== undefined) {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const [slugCheck] = await db.query("SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1", [cleanSlug, id]);
      if (slugCheck.length > 0) {
        return res.status(400).json({ success: false, message: "Slug already in use by another product" });
      }
      updates.push("slug = ?");
      params.push(cleanSlug);
    }

    if (sku !== undefined) {
      const cleanSku = sku.trim().toUpperCase();
      const [skuCheck] = await db.query("SELECT id FROM products WHERE sku = ? AND id != ? LIMIT 1", [cleanSku, id]);
      if (skuCheck.length > 0) {
        return res.status(400).json({ success: false, message: "SKU already in use by another product" });
      }
      updates.push("sku = ?");
      params.push(cleanSku);
    }

    if (short_description !== undefined) {
      updates.push("short_description = ?");
      params.push(short_description ? short_description.trim() : null);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description ? description.trim() : null);
    }

    if (base_price !== undefined) {
      const p = parseFloat(base_price);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ success: false, message: "Invalid base price" });
      }
      updates.push("base_price = ?");
      params.push(p);
    }

    if (discount_price !== undefined) {
      const dp = (discount_price === null || discount_price === "") ? null : parseFloat(discount_price);
      updates.push("discount_price = ?");
      params.push(dp);
    }

    if (category_id !== undefined) {
      const catId = parseInt(category_id, 10);
      updates.push("category_id = ?");
      params.push(catId);
    }

    if (is_featured !== undefined) {
      updates.push("is_featured = ?");
      params.push(is_featured ? 1 : 0);
    }

    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    // Update stock if specified
    if (stock !== undefined) {
      const qty = parseInt(stock, 10);
      if (!isNaN(qty) && qty >= 0) {
        const [inv] = await db.query("SELECT id FROM inventory WHERE product_id = ? AND variant_id IS NULL LIMIT 1", [id]);
        if (inv.length > 0) {
          await db.query("UPDATE inventory SET quantity = ? WHERE id = ?", [qty, inv[0].id]);
        } else {
          await db.query("INSERT INTO inventory (product_id, variant_id, quantity) VALUES (?, NULL, ?)", [id, qty]);
        }
      }
    }

    // Update image if specified
    if (image_url !== undefined && image_url.trim() !== "") {
      const [imgRows] = await db.query("SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1", [id]);
      if (imgRows.length > 0) {
        await db.query("UPDATE product_images SET image_url = ? WHERE id = ?", [image_url.trim(), imgRows[0].id]);
      } else {
        await db.query("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)", [id, image_url.trim()]);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Admin updateProduct error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
}

/**
 * DELETE /api/admin/products/:id
 * Soft delete (deactivate) or delete product with foreign key protection
 */
async function deleteAdminProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid product ID is required" });
    }

    // Check if product is referenced in order_items
    const [orderRefs] = await db.query("SELECT id FROM order_items WHERE product_id = ? LIMIT 1", [id]);

    if (orderRefs.length > 0) {
      // Soft-delete to protect historical orders
      await db.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);
      return res.status(200).json({
        success: true,
        deactivated: true,
        message: "Product has associated order history. Deactivated safely instead of permanent deletion."
      });
    }

    // If no order history, soft-delete or remove
    await db.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully"
    });
  } catch (error) {
    console.error("Admin deleteProduct error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
}

// ============================================================================
// C. INVENTORY MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/inventory
 * List all inventory records with stock status
 */
async function getAdminInventory(req, res) {
  try {
    const query = `
      SELECT 
        i.id,
        i.product_id,
        i.variant_id,
        p.name AS product_name,
        p.sku AS product_sku,
        pv.variant_name,
        pv.sku AS variant_sku,
        i.quantity,
        i.reserved_quantity,
        (i.quantity - i.reserved_quantity) AS available_stock,
        i.low_stock_threshold,
        ((i.quantity - i.reserved_quantity) <= i.low_stock_threshold) AS is_low_stock,
        i.updated_at
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN product_variants pv ON i.variant_id = pv.id
      ORDER BY is_low_stock DESC, (i.quantity - i.reserved_quantity) ASC
    `;

    const [rows] = await db.query(query);

    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        reserved_quantity: Number(r.reserved_quantity),
        available_stock: Number(r.available_stock),
        low_stock_threshold: Number(r.low_stock_threshold),
        is_low_stock: Boolean(r.is_low_stock)
      }))
    });
  } catch (error) {
    console.error("Admin getInventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory data"
    });
  }
}

/**
 * PATCH /api/admin/inventory/:id
 * Update inventory quantity or threshold
 */
async function updateAdminInventory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity, low_stock_threshold } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid inventory ID is required" });
    }

    const [invRows] = await db.query("SELECT * FROM inventory WHERE id = ? LIMIT 1", [id]);
    if (invRows.length === 0) {
      return res.status(404).json({ success: false, message: "Inventory record not found" });
    }

    const updates = [];
    const params = [];

    if (quantity !== undefined) {
      const q = parseInt(quantity, 10);
      if (isNaN(q) || q < 0) {
        return res.status(400).json({ success: false, message: "Quantity must be a non-negative integer" });
      }
      updates.push("quantity = ?");
      params.push(q);
    }

    if (low_stock_threshold !== undefined) {
      const t = parseInt(low_stock_threshold, 10);
      if (!isNaN(t) && t >= 0) {
        updates.push("low_stock_threshold = ?");
        params.push(t);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    params.push(id);
    await db.query(`UPDATE inventory SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

    const [updatedRows] = await db.query("SELECT * FROM inventory WHERE id = ? LIMIT 1", [id]);

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedRows[0]
    });
  } catch (error) {
    console.error("Admin updateInventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory"
    });
  }
}

// ============================================================================
// D. ORDER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/orders
 * List all customer orders with filters
 */
async function getAdminOrders(req, res) {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.user_id,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS customer_name,
        u.email AS customer_email,
        o.subtotal,
        o.shipping_amount AS shipping_fee,
        o.discount_amount,
        o.total_amount,
        o.order_status AS status,
        o.payment_method,
        o.payment_status,
        o.shipping_city,
        o.shipping_state,
        o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== "all") {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query += ` AND (o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        subtotal: Number(r.subtotal),
        shipping_fee: Number(r.shipping_fee),
        total_amount: Number(r.total_amount),
        item_count: Number(r.item_count)
      }))
    });
  } catch (error) {
    console.error("Admin getOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders"
    });
  }
}

/**
 * GET /api/admin/orders/:id
 * Retrieve full order details including line items and shipping details
 */
async function getAdminOrderById(req, res) {
  try {
    const identifier = req.params.id;
    const isNumeric = !isNaN(identifier) && /^\d+$/.test(identifier);

    const query = `
      SELECT 
        o.*,
        o.order_status AS status,
        o.shipping_amount AS shipping_fee,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS customer_name,
        u.email AS customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${isNumeric ? "o.id = ? OR " : ""}o.order_number = ?
      LIMIT 1
    `;

    const params = isNumeric ? [parseInt(identifier, 10), identifier] : [identifier];
    const [orderRows] = await db.query(query, params);

    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRows[0];

    // Fetch order items
    const [items] = await db.query(
      `SELECT oi.*, oi.total_price AS line_total, p.slug AS product_slug,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = oi.product_id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        ) AS image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [order.id]
    );

    // Fetch status history
    const [history] = await db.query(
      `SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`,
      [order.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        shipping_fee: Number(order.shipping_fee),
        total_amount: Number(order.total_amount),
        shipping_address: {
          full_name: order.shipping_full_name,
          phone: order.shipping_phone,
          address_line1: order.shipping_address_line1,
          address_line2: order.shipping_address_line2,
          city: order.shipping_city,
          state: order.shipping_state,
          postal_code: order.shipping_postal_code,
          country: order.shipping_country
        },
        items: items.map((it) => ({
          ...it,
          unit_price: Number(it.unit_price),
          line_total: Number(it.line_total)
        })),
        history
      }
    });
  } catch (error) {
    console.error("Admin getOrderById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details"
    });
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status and log into order_status_history
 */
async function updateAdminOrderStatus(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status, comment } = req.body;
    const adminUserId = req.user.id;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "Valid order ID is required" });
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const cleanStatus = status.toLowerCase();

    const [orderRows] = await db.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const currentOrder = orderRows[0];

    // Determine payment status update if delivering
    let newPaymentStatus = currentOrder.payment_status;
    if (cleanStatus === "delivered" && currentOrder.payment_method === "cod") {
      newPaymentStatus = "paid";
    }

    // Update order
    await db.query(
      `UPDATE orders 
       SET order_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [cleanStatus, newPaymentStatus, orderId]
    );

    // Record in history
    await db.query(
      `INSERT INTO order_status_history (order_id, status, comment, changed_by) 
       VALUES (?, ?, ?, ?)`,
      [
        orderId,
        cleanStatus,
        comment ? comment.trim() : `Status updated to ${cleanStatus} by admin`,
        adminUserId
      ]
    );

    // If order was cancelled, restore inventory
    if (cleanStatus === "cancelled" && currentOrder.order_status !== "cancelled") {
      const [items] = await db.query(
        "SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );
      for (const item of items) {
        let restoreQuery = "UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?";
        const restoreParams = [item.quantity, item.product_id];
        if (item.variant_id) {
          restoreQuery += " AND variant_id = ?";
          restoreParams.push(item.variant_id);
        } else {
          restoreQuery += " AND (variant_id IS NULL OR variant_id = 0)";
        }
        await db.query(restoreQuery, restoreParams);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${cleanStatus}" successfully`,
      data: {
        order_id: orderId,
        status: cleanStatus,
        payment_status: newPaymentStatus
      }
    });
  } catch (error) {
    console.error("Admin updateOrderStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
}

// ============================================================================
// E. USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * List all registered users (customers and admins) with safe profile info
 */
async function getAdminUsers(req, res) {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS name,
        u.email,
        u.role_id,
        r.name AS role,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count,
        COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id = u.id AND order_status != 'cancelled'), 0) AS total_spent
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (role && role !== "all") {
      query += ` AND r.name = ?`;
      params.push(role);
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows.map((u) => ({
        ...u,
        total_spent: Number(u.total_spent),
        order_count: Number(u.order_count)
      }))
    });
  } catch (error) {
    console.error("Admin getUsers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users"
    });
  }
}

/**
 * GET /api/admin/users/:id
 * Retrieve specific customer profile and their order history
 */
async function getAdminUserById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid user ID is required" });
    }

    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS name,
        u.email,
        u.role_id,
        r.name AS role,
        u.is_active,
        u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `;

    const [userRows] = await db.query(query, [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRows[0];

    // Fetch user orders
    const [orders] = await db.query(
      `SELECT id, order_number, total_amount, order_status AS status, payment_method, created_at 
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [id]
    );

    // Fetch user addresses
    const [addresses] = await db.query(
      `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        orders,
        addresses
      }
    });
  } catch (error) {
    console.error("Admin getUserById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user details"
    });
  }
}

// ============================================================================
// F. REVIEW MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/reviews
 * List all product reviews with optional status, rating, and text filters
 */
async function getAdminReviews(req, res) {
  try {
    const { status, rating, search } = req.query;

    let query = `
      SELECT 
        r.id,
        r.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        r.user_id,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS reviewer_name,
        u.email AS reviewer_email,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_active,
        r.created_at,
        r.updated_at
      FROM product_reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status === "active") {
      query += ` AND r.is_active = TRUE`;
    } else if (status === "inactive") {
      query += ` AND r.is_active = FALSE`;
    }

    if (rating && !isNaN(rating)) {
      query += ` AND r.rating = ?`;
      params.push(parseInt(rating, 10));
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query += ` AND (p.name LIKE ? OR r.review_title LIKE ? OR r.review_text LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        ...r,
        rating: Number(r.rating),
        is_active: Boolean(r.is_active)
      }))
    });
  } catch (error) {
    console.error("Admin getReviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reviews"
    });
  }
}

/**
 * PATCH /api/admin/reviews/:id/status
 * Activate or deactivate a review
 */
async function updateAdminReviewStatus(req, res) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { is_active } = req.body;

    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Valid review ID is required"
      });
    }

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: "is_active field is required (boolean)"
      });
    }

    const activeBool = Boolean(is_active);

    const [existing] = await db.query(
      "SELECT id FROM product_reviews WHERE id = ? LIMIT 1",
      [reviewId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    await db.query(
      "UPDATE product_reviews SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [activeBool ? 1 : 0, reviewId]
    );

    return res.status(200).json({
      success: true,
      message: `Review ${activeBool ? "activated" : "deactivated"} successfully`,
      data: {
        id: reviewId,
        is_active: activeBool
      }
    });
  } catch (error) {
    console.error("Admin updateReviewStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update review status"
    });
  }
}

module.exports = {
  getDashboardStats,
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminInventory,
  updateAdminInventory,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getAdminUsers,
  getAdminUserById,
  getAdminReviews,
  updateAdminReviewStatus
};
