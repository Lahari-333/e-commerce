const assert = require("assert");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const db = require("../config/db");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");

// Helper mock response
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("PHASE 13: PRODUCT VARIANT & INVENTORY AUTOMATED TESTS");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function record(title, condition, detail = "") {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title} - ${detail}`);
      failed++;
    }
  }

  // Pick a test user
  const testUserId = 1; // Demo Customer

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Product Details API returns variants with variant-specific inventory
    // -------------------------------------------------------------------------
    console.log("--- Test Group 1: Product Variants & Inventory Query ---");
    {
      const req = { params: { slug: "wireless-anc-headphones" } };
      const res = createMockRes();
      await productController.getProductBySlug(req, res);

      record(
        "Product details returns 200 OK",
        res.statusCode === 200 && res.body?.success === true
      );

      const product = res.body?.data;
      record(
        "Product has variants array",
        Array.isArray(product?.variants) && product.variants.length > 0
      );

      const firstVariant = product?.variants?.[0];
      record(
        "Variant contains available_stock and in_stock fields",
        typeof firstVariant?.available_stock === "number" &&
          typeof firstVariant?.in_stock === "boolean"
      );

      record(
        "Variant contains price_modifier and variant_image",
        typeof firstVariant?.price_modifier === "number" &&
          "variant_image" in firstVariant
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Multi-variant product requires variant selection in addToCart
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 2: Mandatory Variant Selection ---");
    {
      // Product 1 has 2 variants (Matte Black, Silver White)
      const reqWithoutVariant = {
        user: { id: testUserId },
        body: { product_id: 1, quantity: 1 } // variant_id missing
      };
      const res = createMockRes();
      await cartController.addToCart(reqWithoutVariant, res);

      record(
        "Adding multi-variant product without variant_id is rejected with 400",
        res.statusCode === 400 && res.body?.success === false
      );
      record(
        "Rejection message explicitly prompts to select a variant",
        res.body?.message?.toLowerCase().includes("select a product variant")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Invalid or non-existent variant_id is rejected
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 3: Invalid Variant Validation ---");
    {
      const reqWithBadVariant = {
        user: { id: testUserId },
        body: { product_id: 1, variant_id: 999999, quantity: 1 }
      };
      const res = createMockRes();
      await cartController.addToCart(reqWithBadVariant, res);

      record(
        "Adding with non-existent variant_id is rejected with 400",
        res.statusCode === 400 && res.body?.success === false
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Adding valid variant adds to cart with adjusted price and variant info
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 4: Successful Variant Addition & Cart Calculation ---");
    let addedCartItemId = null;
    {
      // First clean cart for test user
      const [userCart] = await db.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [testUserId]);
      if (userCart.length > 0) {
        await db.query("DELETE FROM cart_items WHERE cart_id = ?", [userCart[0].id]);
      }

      // Add Product 1 Variant 1 (Matte Black)
      const reqAdd = {
        user: { id: testUserId },
        body: { product_id: 1, variant_id: 1, quantity: 2 }
      };
      const res = createMockRes();
      await cartController.addToCart(reqAdd, res);

      record(
        "Adding valid variant returns 200 OK",
        res.statusCode === 200 && res.body?.success === true
      );

      const items = res.body?.data?.items || [];
      const item = items.find((i) => i.product_id === 1 && i.variant_id === 1);
      record(
        "Cart item has variant_id and variant_name populated",
        item && item.variant_id === 1 && item.variant_name === "Matte Black"
      );
      record(
        "Cart item has accurate available_stock",
        item && typeof item.available_stock === "number" && item.available_stock > 0
      );

      if (item) addedCartItemId = item.id;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Exceeding variant available stock is rejected
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 5: Variant Stock Enforcement ---");
    {
      // Look up stock for variant 1
      const [inv] = await db.query(
        "SELECT (quantity - reserved_quantity) AS stock FROM inventory WHERE product_id = 1 AND variant_id = 1"
      );
      const stock = inv[0].stock;

      // Try to add more than stock
      const reqExcess = {
        user: { id: testUserId },
        body: { product_id: 1, variant_id: 1, quantity: stock + 10 }
      };
      const res = createMockRes();
      await cartController.addToCart(reqExcess, res);

      record(
        "Adding more than variant stock is rejected with 400",
        res.statusCode === 400 && res.body?.success === false
      );
      record(
        "Error message mentions stock availability",
        res.body?.message?.toLowerCase().includes("stock")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Updating cart item quantity respects variant stock
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 6: Cart Item Quantity Update Validation ---");
    {
      if (addedCartItemId) {
        // Try updating to 99999
        const reqUpdateExcess = {
          user: { id: testUserId },
          params: { itemId: addedCartItemId },
          body: { quantity: 99999 }
        };
        const resExcess = createMockRes();
        await cartController.updateCartItem(reqUpdateExcess, resExcess);

        record(
          "Updating item quantity past variant stock is rejected with 400",
          resExcess.statusCode === 400 && resExcess.body?.success === false
        );

        // Valid update to 3
        const reqUpdateValid = {
          user: { id: testUserId },
          params: { itemId: addedCartItemId },
          body: { quantity: 3 }
        };
        const resValid = createMockRes();
        await cartController.updateCartItem(reqUpdateValid, resValid);

        record(
          "Updating item quantity within stock limits succeeds with 200",
          resValid.statusCode === 200 && resValid.body?.success === true
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: Checkout preserves variant details and deducts variant inventory
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 7: Checkout & Inventory Deduction ---");
    {
      // Get address for test user
      const [addr] = await db.query("SELECT id FROM addresses WHERE user_id = ? LIMIT 1", [testUserId]);
      const addressId = addr[0].id;

      // Check inventory before order
      const [beforeInv] = await db.query(
        "SELECT quantity FROM inventory WHERE product_id = 1 AND variant_id = 1"
      );
      const qtyBefore = beforeInv[0].quantity;

      const reqOrder = {
        user: { id: testUserId },
        body: {
          address_id: addressId,
          payment_method: "cod",
          notes: "Phase 13 Variant Test Order"
        }
      };
      const resOrder = createMockRes();
      await orderController.createOrder(reqOrder, resOrder);

      record(
        "Order creation with variant item returns 201 Created",
        resOrder.statusCode === 201 && resOrder.body?.success === true
      );

      const orderData = resOrder.body?.data;
      const orderId = orderData?.order_id || orderData?.id;

      // Check order_items table for variant_id and variant_name
      const [orderItems] = await db.query(
        "SELECT variant_id, variant_name FROM order_items WHERE order_id = ?",
        [orderId]
      );
      record(
        "Order item preserved variant_id and variant_name",
        orderItems.length > 0 &&
          orderItems[0].variant_id === 1 &&
          orderItems[0].variant_name === "Matte Black"
      );

      // Check inventory deducted
      const [afterInv] = await db.query(
        "SELECT quantity FROM inventory WHERE product_id = 1 AND variant_id = 1"
      );
      const qtyAfter = afterInv[0].quantity;
      record(
        "Inventory deducted accurately for the specific variant",
        qtyAfter === qtyBefore - 3
      );

      // Clean up test order and restore inventory
      await db.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
      await db.query("DELETE FROM orders WHERE id = ?", [orderId]);
      await db.query(
        "UPDATE inventory SET quantity = ? WHERE product_id = 1 AND variant_id = 1",
        [qtyBefore]
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Products without variants work smoothly without variant_id
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 8: Products Without Variants (Regression) ---");
    {
      // Product 10 (RGB Mechanical Gaming Keyboard) has no variants in DB
      const [variants] = await db.query(
        "SELECT id FROM product_variants WHERE product_id = 10 AND is_active = TRUE"
      );
      record("Product 10 verified to have no variants", variants.length === 0);

      const reqAddNonVariant = {
        user: { id: testUserId },
        body: { product_id: 10, quantity: 1 } // No variant_id
      };
      const res = createMockRes();
      await cartController.addToCart(reqAddNonVariant, res);

      record(
        "Adding product without variants succeeds without variant_id",
        res.statusCode === 200 && res.body?.success === true
      );

      const items = res.body?.data?.items || [];
      const item = items.find((i) => i.product_id === 10);
      record(
        "Non-variant cart item has variant_id null and variant_name null",
        item && item.variant_id === null && item.variant_name === null
      );

      // Clean cart
      const [userCart] = await db.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [testUserId]);
      if (userCart.length > 0) {
        await db.query("DELETE FROM cart_items WHERE cart_id = ?", [userCart[0].id]);
      }
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  } finally {
    console.log("\n-------------------------------------------------------");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("-------------------------------------------------------\n");
    await db.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
