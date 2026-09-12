const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById
} = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All order endpoints require authentication
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

module.exports = router;
