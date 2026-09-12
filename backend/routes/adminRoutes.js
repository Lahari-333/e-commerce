const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/adminController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

// Strictly enforce JWT authentication and Admin role for all routes in this router
router.use(authenticateToken);
router.use(requireAdmin);

// A. Dashboard Analytics
router.get("/dashboard/stats", getDashboardStats);

// B. Product Management
router.get("/products", getAdminProducts);
router.post("/products", createAdminProduct);
router.get("/products/:id", getAdminProductById);
router.patch("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

// C. Inventory Management
router.get("/inventory", getAdminInventory);
router.patch("/inventory/:id", updateAdminInventory);

// D. Order Management
router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateAdminOrderStatus);

// E. User Management
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);

// F. Review Moderation Management
router.get("/reviews", getAdminReviews);
router.patch("/reviews/:id/status", updateAdminReviewStatus);

module.exports = router;
