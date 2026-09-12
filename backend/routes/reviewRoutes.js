const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getProductReviews,
  createProductReview,
  updateReview,
  deleteReview
} = require("../controllers/reviewController");

// Public: Retrieve all approved/active reviews for a product
router.get("/products/:productId/reviews", getProductReviews);

// Protected: Customer submits a review for a product
router.post("/products/:productId/reviews", authenticateToken, createProductReview);

// Protected: Customer edits their own review
router.patch("/reviews/:reviewId", authenticateToken, updateReview);

// Protected: Customer (or Admin) deletes a review
router.delete("/reviews/:reviewId", authenticateToken, deleteReview);

module.exports = router;
