const db = require("../config/db");

/**
 * Helper to fetch and calculate cart data for an authenticated user
 */
async function getCartForUser(userId) {
  const [cartRows] = await db.query(
    "SELECT id FROM carts WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (cartRows.length === 0) {
    return {
      cart_id: null,
      items: [],
      subtotal: 0,
      total_item_count: 0
    };
  }

  const cartId = cartRows[0].id;

  const itemsQuery = `
    SELECT 
      ci.id,
      ci.cart_id,
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      p.name AS product_name,
      p.slug AS product_slug,
      p.base_price,
      p.discount_price,
      p.is_active AS product_is_active,
      pv.variant_name,
      pv.price_modifier,
      pv.is_active AS variant_is_active,
      COALESCE(
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.variant_id = ci.variant_id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        ),
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        )
      ) AS image,
      COALESCE(
        (
          SELECT (inv.quantity - inv.reserved_quantity)
          FROM inventory inv
          WHERE inv.product_id = ci.product_id 
            AND (
              (ci.variant_id IS NOT NULL AND inv.variant_id = ci.variant_id)
              OR (ci.variant_id IS NULL AND (inv.variant_id IS NULL OR inv.variant_id = 0))
            )
          LIMIT 1
        ),
        (
          SELECT SUM(inv.quantity - inv.reserved_quantity)
          FROM inventory inv
          WHERE inv.product_id = ci.product_id AND ci.variant_id IS NULL
        ),
        0
      ) AS available_stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
    ORDER BY ci.created_at DESC
  `;

  const [itemsRows] = await db.query(itemsQuery, [cartId]);

  let subtotal = 0;
  let totalItemCount = 0;

  const formattedItems = itemsRows.map((row) => {
    const base = row.discount_price !== null ? Number(row.discount_price) : Number(row.base_price);
    const modifier = row.price_modifier !== null ? Number(row.price_modifier) : 0;
    const unitPrice = Number((base + modifier).toFixed(2));
    const lineTotal = Number((unitPrice * row.quantity).toFixed(2));

    subtotal += lineTotal;
    totalItemCount += row.quantity;

    return {
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name,
      product_slug: row.product_slug,
      price: unitPrice,
      image: row.image,
      variant_id: row.variant_id,
      variant_name: row.variant_name,
      quantity: row.quantity,
      line_total: lineTotal,
      available_stock: Math.max(0, Number(row.available_stock || 0))
    };
  });

  return {
    cart_id: cartId,
    items: formattedItems,
    subtotal: Number(subtotal.toFixed(2)),
    total_item_count: totalItemCount
  };
}

/**
 * Helper to ensure a cart exists for a user and return cartId
 */
async function getOrCreateCartId(userId) {
  const [existing] = await db.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);
  if (existing.length > 0) {
    return existing[0].id;
  }
  await db.query(
    "INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP",
    [userId]
  );
  const [newCart] = await db.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);
  return newCart[0].id;
}

/**
 * Helper to check available inventory for a product / variant
 */
async function getAvailableStock(productId, variantId) {
  if (variantId) {
    const [rows] = await db.query(
      "SELECT (quantity - reserved_quantity) AS stock FROM inventory WHERE product_id = ? AND variant_id = ? LIMIT 1",
      [productId, variantId]
    );
    if (rows.length > 0) return Math.max(0, Number(rows[0].stock));
    return 0; // If variant exists in product_variants but has no inventory record, stock is strictly 0
  }

  // Check product-level inventory record (for products without variants)
  const [rows] = await db.query(
    "SELECT (quantity - reserved_quantity) AS stock FROM inventory WHERE product_id = ? AND (variant_id IS NULL OR variant_id = 0) LIMIT 1",
    [productId]
  );
  if (rows.length > 0) return Math.max(0, Number(rows[0].stock));

  // If product has variants, stock cannot be lumped together without a variant
  const [variants] = await db.query(
    "SELECT id FROM product_variants WHERE product_id = ? AND is_active = TRUE LIMIT 1",
    [productId]
  );
  if (variants.length > 0) {
    return 0; // Product requires variant selection
  }

  const [sumRows] = await db.query(
    "SELECT SUM(quantity - reserved_quantity) AS stock FROM inventory WHERE product_id = ?",
    [productId]
  );
  if (sumRows.length > 0 && sumRows[0].stock !== null) {
    return Math.max(0, Number(sumRows[0].stock));
  }

  return 0;
}

/**
 * GET /api/cart
 * Retrieve the current authenticated user's cart
 */
async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const cart = await getCartForUser(userId);

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve shopping cart"
    });
  }
}

/**
 * POST /api/cart/items
 * Add an item to the user's cart (or increment quantity if already present)
 */
async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, variant_id, quantity } = req.body;

    // 1. Validation
    const productId = parseInt(product_id, 10);
    if (!productId || isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required"
      });
    }

    const qty = quantity !== undefined ? parseInt(quantity, 10) : 1;
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    // 2. Verify product exists and is active
    const [productRows] = await db.query(
      "SELECT id, name, is_active FROM products WHERE id = ? LIMIT 1",
      [productId]
    );
    if (productRows.length === 0 || !productRows[0].is_active) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently unavailable"
      });
    }

    // 3. Verify variant requirement & validity
    let cleanVariantId = null;

    // Check if product has active variants
    const [productVariants] = await db.query(
      "SELECT id, variant_name, price_modifier, is_active FROM product_variants WHERE product_id = ? AND is_active = TRUE",
      [productId]
    );

    const hasVariants = productVariants.length > 0;

    if (hasVariants) {
      if (variant_id === undefined || variant_id === null || variant_id === "") {
        return res.status(400).json({
          success: false,
          message: "Please select a product variant before adding to cart"
        });
      }

      const parsedVarId = parseInt(variant_id, 10);
      if (isNaN(parsedVarId) || parsedVarId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid variant ID supplied"
        });
      }

      const matchedVariant = productVariants.find((v) => v.id === parsedVarId);
      if (!matchedVariant) {
        return res.status(400).json({
          success: false,
          message: "The selected variant is invalid or inactive"
        });
      }
      cleanVariantId = parsedVarId;
    } else {
      // Product has NO variants; ignore any extraneous variant_id
      cleanVariantId = null;
    }

    // 4. Check available inventory
    const availableStock = await getAvailableStock(productId, cleanVariantId);
    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: cleanVariantId
          ? "The selected variant is currently out of stock"
          : "This product is currently out of stock"
      });
    }

    // 5. Get or create cart
    const cartId = await getOrCreateCartId(userId);

    // 6. Check if product + variant already exists in cart
    let existingItemQuery = `
      SELECT id, quantity 
      FROM cart_items 
      WHERE cart_id = ? AND product_id = ?
    `;
    const existingParams = [cartId, productId];

    if (cleanVariantId) {
      existingItemQuery += ` AND variant_id = ?`;
      existingParams.push(cleanVariantId);
    } else {
      existingItemQuery += ` AND variant_id IS NULL`;
    }

    const [existingItems] = await db.query(existingItemQuery, existingParams);

    if (existingItems.length > 0) {
      const currentQty = existingItems[0].quantity;
      const newQty = currentQty + qty;

      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} more. Only ${availableStock} in stock (you already have ${currentQty} in cart).`
        });
      }

      await db.query(
        "UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newQty, existingItems[0].id]
      );
    } else {
      if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} units. Only ${availableStock} available in stock.`
        });
      }

      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)",
        [cartId, productId, cleanVariantId, qty]
      );
    }

    // 7. Return updated cart
    const updatedCart = await getCartForUser(userId);
    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart"
    });
  }
}

/**
 * PATCH /api/cart/items/:itemId
 * Update quantity of a cart item
 */
async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity } = req.body;

    if (!itemId || isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid cart item ID is required"
      });
    }

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty) || newQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    // Verify item belongs to the authenticated user's cart
    const verifyQuery = `
      SELECT ci.id, ci.product_id, ci.variant_id 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
      LIMIT 1
    `;
    const [itemRows] = await db.query(verifyQuery, [itemId, userId]);

    if (itemRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found or does not belong to your cart"
      });
    }

    const item = itemRows[0];

    // Check inventory stock
    const availableStock = await getAvailableStock(item.product_id, item.variant_id);
    if (newQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} unit(s) available in stock`
      });
    }

    // Update quantity
    await db.query(
      "UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newQty, itemId]
    );

    const updatedCart = await getCartForUser(userId);
    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item"
    });
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove an item from the cart
 */
async function removeCartItem(req, res) {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10);

    if (!itemId || isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid cart item ID is required"
      });
    }

    // Check ownership
    const verifyQuery = `
      SELECT ci.id 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
      LIMIT 1
    `;
    const [itemRows] = await db.query(verifyQuery, [itemId, userId]);

    if (itemRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found or does not belong to your cart"
      });
    }

    // Delete item
    await db.query("DELETE FROM cart_items WHERE id = ?", [itemId]);

    const updatedCart = await getCartForUser(userId);
    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error removing cart item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart"
    });
  }
}

/**
 * DELETE /api/cart
 * Clear all items from the user's cart
 */
async function clearCart(req, res) {
  try {
    const userId = req.user.id;

    const [cartRows] = await db.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);

    if (cartRows.length > 0) {
      const cartId = cartRows[0].id;
      await db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    }

    return res.status(200).json({
      success: true,
      message: "Shopping cart cleared",
      data: {
        cart_id: cartRows.length > 0 ? cartRows[0].id : null,
        items: [],
        subtotal: 0,
        total_item_count: 0
      }
    });
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to clear shopping cart"
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
