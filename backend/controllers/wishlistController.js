const db = require("../config/db");

/**
 * Helper: Retrieve or automatically initialize a user's wishlist record
 */
async function getOrCreateUserWishlist(userId) {
  const [rows] = await db.query(
    "SELECT id FROM wishlists WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await db.query(
    "INSERT INTO wishlists (user_id) VALUES (?)",
    [userId]
  );
  return result.insertId;
}

/**
 * GET /api/wishlist
 * Returns current authenticated user's wishlist items with product information
 */
async function getWishlist(req, res) {
  try {
    const userId = req.user.id;
    const wishlistId = await getOrCreateUserWishlist(userId);

    const query = `
      SELECT 
        wi.id AS item_id,
        wi.product_id,
        wi.created_at AS added_at,
        p.name,
        p.slug,
        p.base_price,
        p.discount_price,
        p.is_active,
        p.category_id,
        c.name AS category_name,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        ) AS image,
        COALESCE(
          (SELECT SUM(inv.quantity - inv.reserved_quantity) 
           FROM inventory inv 
           WHERE inv.product_id = p.id), 0
        ) AS current_stock
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = ?
      ORDER BY wi.created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);

    const formattedItems = rows.map((r) => ({
      item_id: r.item_id,
      product_id: r.product_id,
      name: r.name,
      slug: r.slug,
      base_price: Number(r.base_price),
      discount_price: r.discount_price !== null ? Number(r.discount_price) : null,
      price: r.discount_price !== null ? Number(r.discount_price) : Number(r.base_price),
      image: r.image || "",
      category_id: r.category_id,
      category_name: r.category_name,
      current_stock: Number(r.current_stock),
      in_stock: Number(r.current_stock) > 0,
      is_active: Boolean(r.is_active),
      added_at: r.added_at
    }));

    return res.status(200).json({
      success: true,
      data: {
        wishlist_id: wishlistId,
        total_items: formattedItems.length,
        items: formattedItems
      }
    });
  } catch (error) {
    console.error("getWishlist error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wishlist items"
    });
  }
}

/**
 * POST /api/wishlist/items
 * Add a product to current user's wishlist
 */
async function addToWishlist(req, res) {
  try {
    const userId = req.user.id;
    const rawProductId = req.body.product_id || req.body.productId;
    const productId = parseInt(rawProductId, 10);

    if (!productId || isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid numeric product_id is required"
      });
    }

    // Validate that the product exists and is active
    const [productRows] = await db.query(
      "SELECT id, name, is_active FROM products WHERE id = ? LIMIT 1",
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!productRows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: "Cannot add an inactive product to wishlist"
      });
    }

    const wishlistId = await getOrCreateUserWishlist(userId);

    // Check for duplicate in wishlist
    const [existing] = await db.query(
      "SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ? LIMIT 1",
      [wishlistId, productId]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Product is already in your wishlist",
        already_in_wishlist: true,
        item_id: existing[0].id
      });
    }

    // Insert into wishlist_items
    const [insertResult] = await db.query(
      "INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)",
      [wishlistId, productId]
    );

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully",
      item_id: insertResult.insertId,
      product_id: productId
    });
  } catch (error) {
    console.error("addToWishlist error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist"
    });
  }
}

/**
 * DELETE /api/wishlist/items/:productId
 * Remove a product from current user's wishlist
 */
async function removeFromWishlist(req, res) {
  try {
    const userId = req.user.id;
    const rawId = req.params.productId;
    const targetId = parseInt(rawId, 10);

    if (!targetId || isNaN(targetId) || targetId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required"
      });
    }

    // Remove matching by product_id or wishlist_items.id, scoped strictly to the current user's wishlist
    const deleteQuery = `
      DELETE wi FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ? AND (wi.product_id = ? OR wi.id = ?)
    `;

    const [result] = await db.query(deleteQuery, [userId, targetId, targetId]);

    return res.status(200).json({
      success: true,
      message: result.affectedRows > 0
        ? "Product removed from wishlist"
        : "Product was not present in your wishlist",
      removed: result.affectedRows > 0
    });
  } catch (error) {
    console.error("removeFromWishlist error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist"
    });
  }
}

/**
 * DELETE /api/wishlist
 * Clear all items from current user's wishlist
 */
async function clearWishlist(req, res) {
  try {
    const userId = req.user.id;

    const clearQuery = `
      DELETE wi FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ?
    `;

    const [result] = await db.query(clearQuery, [userId]);

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      cleared_count: result.affectedRows
    });
  } catch (error) {
    console.error("clearWishlist error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist"
    });
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
