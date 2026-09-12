const db = require("../config/db");

/**
 * POST /api/orders
 * Place a new order using authenticated user's cart and selected address inside a MySQL transaction
 */
async function createOrder(req, res) {
  const userId = req.user.id;
  const { address_id, payment_method = "cod", notes = null } = req.body;

  // 1. Validate inputs
  const addressId = parseInt(address_id, 10);
  if (!addressId || isNaN(addressId)) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid shipping address"
    });
  }

  // Allowed payment methods for now (Cash on Delivery or Test Payment)
  const cleanPaymentMethod = payment_method === "test_payment" ? "cod" : payment_method.toLowerCase();
  if (cleanPaymentMethod !== "cod") {
    return res.status(400).json({
      success: false,
      message: "Invalid payment method. Only Cash on Delivery is supported currently."
    });
  }

  // 2. Verify selected address belongs to the authenticated user
  const [addressRows] = await db.query(
    "SELECT * FROM addresses WHERE id = ? AND user_id = ? LIMIT 1",
    [addressId, userId]
  );

  if (addressRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Shipping address not found or does not belong to your account"
    });
  }

  const shippingAddress = addressRows[0];

  // 3. Acquire dedicated connection for transaction
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 4. Read user's cart
    const [cartRows] = await connection.query(
      "SELECT id FROM carts WHERE user_id = ? LIMIT 1 FOR UPDATE",
      [userId]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before placing an order."
      });
    }

    const cartId = cartRows[0].id;

    // Fetch cart items with product, variant, and inventory details
    const cartItemsQuery = `
      SELECT 
        ci.id AS cart_item_id,
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
        pv.is_active AS variant_is_active
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = ?
      FOR UPDATE
    `;

    const [cartItems] = await connection.query(cartItemsQuery, [cartId]);

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before placing an order."
      });
    }

    // 5. Verify product availability, variant validity, inventory, and calculate totals
    let subtotal = 0;
    const orderItemsToInsert = [];

    for (const item of cartItems) {
      if (!item.product_is_active) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Product "${item.product_name}" is no longer active or available for purchase.`
        });
      }

      if (item.variant_id && !item.variant_is_active) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Variant "${item.variant_name}" for product "${item.product_name}" is no longer available.`
        });
      }

      // Check if product has active variants and requires variant selection
      const [prodVariants] = await connection.query(
        "SELECT id, variant_name FROM product_variants WHERE product_id = ? AND is_active = TRUE",
        [item.product_id]
      );
      if (prodVariants.length > 0 && !item.variant_id) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Please select a variant for "${item.product_name}" before checking out.`
        });
      }

      // Check and lock inventory row
      let inventoryQuery = `
        SELECT id, quantity, reserved_quantity 
        FROM inventory 
        WHERE product_id = ?
      `;
      const invParams = [item.product_id];

      if (item.variant_id) {
        inventoryQuery += " AND variant_id = ?";
        invParams.push(item.variant_id);
      } else {
        inventoryQuery += " AND (variant_id IS NULL OR variant_id = 0)";
      }
      inventoryQuery += " LIMIT 1 FOR UPDATE";

      const [invRows] = await connection.query(inventoryQuery, invParams);

      if (invRows.length === 0 || (invRows[0].quantity - invRows[0].reserved_quantity) < item.quantity) {
        const availableStock = invRows.length > 0 ? Math.max(0, invRows[0].quantity - invRows[0].reserved_quantity) : 0;
        await connection.rollback();
        connection.release();
        const displayName = item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${displayName}". Only ${availableStock} unit(s) available.`
        });
      }

      // Calculate price from trusted database values
      const base = item.discount_price !== null ? Number(item.discount_price) : Number(item.base_price);
      const modifier = item.price_modifier !== null ? Number(item.price_modifier) : 0;
      const unitPrice = Number((base + modifier).toFixed(2));
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

      subtotal += lineTotal;

      orderItemsToInsert.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product_name,
        variant_name: item.variant_name || null,
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: lineTotal
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // 6. Shipping fee calculation (Free if subtotal >= 1000, else 50)
    const shippingFee = subtotal >= 1000 ? 0.0 : 50.0;
    const discountAmount = 0.0;
    const totalAmount = Number((subtotal + shippingFee - discountAmount).toFixed(2));

    // 7. Generate unique order number
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestamp}-${randomSuffix}`;

    // 8. Insert Order record with shipping snapshot
    const insertOrderQuery = `
      INSERT INTO orders (
        order_number,
        user_id,
        shipping_address_id,
        billing_address_id,
        subtotal,
        discount_amount,
        tax_amount,
        shipping_amount,
        total_amount,
        order_status,
        payment_method,
        payment_status,
        shipping_full_name,
        shipping_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, 0.00, ?, ?, 'pending', ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [orderResult] = await connection.query(insertOrderQuery, [
      orderNumber,
      userId,
      shippingAddress.id,
      shippingAddress.id,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      "cod",
      shippingAddress.full_name,
      shippingAddress.phone,
      shippingAddress.address_line1,
      shippingAddress.address_line2 || null,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postal_code,
      shippingAddress.country,
      notes ? String(notes).trim() : null
    ]);

    const orderId = orderResult.insertId;

    // 9. Insert order_items & deduct inventory
    for (const oi of orderItemsToInsert) {
      await connection.query(
        `INSERT INTO order_items (
          order_id,
          product_id,
          variant_id,
          product_name,
          variant_name,
          unit_price,
          quantity,
          total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          oi.product_id,
          oi.variant_id,
          oi.product_name,
          oi.variant_name,
          oi.unit_price,
          oi.quantity,
          oi.total_price
        ]
      );

      // Deduct inventory
      let updateInvQuery = `
        UPDATE inventory 
        SET quantity = GREATEST(0, quantity - ?), updated_at = CURRENT_TIMESTAMP 
        WHERE product_id = ?
      `;
      const updateInvParams = [oi.quantity, oi.product_id];

      if (oi.variant_id) {
        updateInvQuery += " AND variant_id = ?";
        updateInvParams.push(oi.variant_id);
      } else {
        updateInvQuery += " AND (variant_id IS NULL OR variant_id = 0)";
      }

      await connection.query(updateInvQuery, updateInvParams);
    }

    // 10. Record payment placeholder entry
    await connection.query(
      `INSERT INTO payments (
        order_id,
        payment_method,
        amount,
        currency,
        payment_status
      ) VALUES (?, 'cod', ?, 'INR', 'pending')`,
      [orderId, totalAmount]
    );

    // 11. Record initial status history
    await connection.query(
      `INSERT INTO order_status_history (
        order_id,
        status,
        comment
      ) VALUES (?, 'pending', 'Order placed successfully by customer via Cash on Delivery')`,
      [orderId]
    );

    // 12. Clear user's cart
    await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    // 13. Commit transaction
    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order_id: orderId,
        order_number: orderNumber,
        status: "pending",
        payment_method: "cod",
        payment_status: "pending",
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        item_count: orderItemsToInsert.length,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Order creation transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while placing your order. Please try again."
    });
  }
}

/**
 * GET /api/orders
 * Retrieve all orders belonging to the authenticated customer
 */
async function getOrders(req, res) {
  try {
    const userId = req.user.id;

    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.order_status AS status,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.shipping_amount AS shipping_fee,
        o.discount_amount,
        o.total_amount,
        o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS total_items
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;

    const [rows] = await db.query(ordersQuery, [userId]);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order history"
    });
  }
}

/**
 * GET /api/orders/:id
 * Retrieve details for a specific order belonging to the authenticated customer
 */
async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const identifier = req.params.id;

    const isNumeric = !isNaN(identifier) && /^\d+$/.test(identifier);

    let orderQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.order_status AS status,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.shipping_amount AS shipping_fee,
        o.discount_amount,
        o.total_amount,
        o.notes,
        o.shipping_full_name,
        o.shipping_phone,
        o.shipping_address_line1,
        o.shipping_address_line2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postal_code,
        o.shipping_country,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.user_id = ? AND (${isNumeric ? "o.id = ? OR " : ""}o.order_number = ?)
      LIMIT 1
    `;

    const queryParams = isNumeric
      ? [userId, parseInt(identifier, 10), identifier]
      : [userId, identifier];

    const [orderRows] = await db.query(orderQuery, queryParams);

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or does not belong to your account"
      });
    }

    const order = orderRows[0];

    // Fetch order items with product primary image
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.product_id,
        oi.variant_id,
        oi.product_name,
        oi.variant_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price AS line_total,
        p.slug AS product_slug,
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
      ORDER BY oi.id ASC
    `;

    const [items] = await db.query(itemsQuery, [order.id]);

    return res.status(200).json({
      success: true,
      data: {
        ...order,
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
          id: it.id,
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_name: it.product_name,
          variant_name: it.variant_name,
          unit_price: Number(it.unit_price),
          quantity: it.quantity,
          line_total: Number(it.line_total),
          product_slug: it.product_slug,
          image: it.image
        }))
      }
    });
  } catch (error) {
    console.error("Error retrieving order details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details"
    });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById
};
