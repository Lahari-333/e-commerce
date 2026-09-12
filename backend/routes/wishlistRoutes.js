const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require("../controllers/wishlistController");

// Enforce JWT authentication on all wishlist endpoints
router.use(authenticateToken);

router.get("/", getWishlist);
router.post("/items", addToWishlist);
router.delete("/items/:productId", removeFromWishlist);
router.delete("/", clearWishlist);

module.exports = router;
