const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require("../controllers/cartController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All cart operations require authentication
router.use(authenticateToken);

// Get current cart
router.get("/", getCart);

// Add item to cart
router.post("/items", addToCart);

// Update item quantity
router.patch("/items/:itemId", updateCartItem);

// Remove single item from cart
router.delete("/items/:itemId", removeCartItem);

// Clear all items from cart
router.delete("/", clearCart);

module.exports = router;
