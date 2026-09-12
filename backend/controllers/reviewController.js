const db = require("../config/db");

/**
 * Helper: Resolve product by either numeric ID or unique slug
 */
async function resolveProduct(identifier) {
  const isNumeric = !isNaN(identifier) && /^\d+$/.test(identifier);
  const query = `
    SELECT id, name, slug, is_active 
    FROM products 
    WHERE ${isNumeric ? "id = ? OR " : ""}slug = ? 
    LIMIT 1
  `;
  const params = isNumeric ? [parseInt(identifier, 10), identifier] : [identifier];
  const [rows] = await db.query(query, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * GET /api/products/:productId/reviews
 * Public: List active reviews and aggregates for a specific product
 */
async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const product = await resolveProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const query = `
      SELECT 
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_active,
        r.created_at,
        r.updated_at,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS reviewer_name,
        (
          SELECT COUNT(*) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE o.user_id = r.user_id 
            AND oi.product_id = r.product_id 
            AND o.order_status = 'delivered'
        ) > 0 AS verified_purchase
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_active = TRUE
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(query, [product.id]);

    const totalReviews = rows.length;
    const ratingSum = rows.reduce((sum, rev) => sum + Number(rev.rating), 0);
    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rows.forEach((rev) => {
      const r = Number(rev.rating);
      if (breakdown[r] !== undefined) {
        breakdown[r] += 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        total_reviews: totalReviews,
        average_rating: averageRating,
        breakdown,
        reviews: rows.map((r) => ({
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          rating: Number(r.rating),
          review_title: r.review_title || "",
          review_text: r.review_text || "",
          reviewer_name: r.reviewer_name || "Verified Customer",
          verified_purchase: Boolean(r.verified_purchase),
          created_at: r.created_at,
          updated_at: r.updated_at
        }))
      }
    });
  } catch (error) {
    console.error("getProductReviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product reviews"
    });
  }
}

/**
 * POST /api/products/:productId/reviews
 * Protected: Submit a review for a product
 */
async function createProductReview(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, review_title, review_text } = req.body;

    const product = await resolveProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: "Cannot review an inactive product"
      });
    }

    // Validate rating
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    // Validate review text
    if (!review_text || review_text.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be at least 3 characters"
      });
    }

    if (review_text.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot exceed 3000 characters"
      });
    }

    const cleanTitle = review_title ? review_title.trim().slice(0, 255) : null;
    const cleanText = review_text.trim();

    // Check for duplicate review by same user on this product -> 409 Conflict
    const [existing] = await db.query(
      "SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1",
      [userId, product.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review for this product. You can edit your existing review instead."
      });
    }

    // Insert new review
    const insertQuery = `
      INSERT INTO product_reviews (product_id, user_id, rating, review_title, review_text, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `;
    const [result] = await db.query(insertQuery, [
      product.id,
      userId,
      numRating,
      cleanTitle,
      cleanText
    ]);

    return res.status(201).json({
      success: true,
      message: "Thank you! Your review has been submitted successfully.",
      data: {
        id: result.insertId,
        product_id: product.id,
        user_id: userId,
        rating: numRating,
        review_title: cleanTitle,
        review_text: cleanText,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error("createProductReview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review"
    });
  }
}

/**
 * PATCH /api/reviews/:reviewId
 * Protected: Edit an existing review (only review owner)
 */
async function updateReview(req, res) {
  try {
    const userId = req.user.id;
    const reviewId = parseInt(req.params.reviewId, 10);
    const { rating, review_title, review_text } = req.body;

    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Valid review ID is required"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM product_reviews WHERE id = ? LIMIT 1",
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const review = rows[0];

    // Strictly enforce ownership: only owner can edit
    if (review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only edit your own reviews"
      });
    }

    const updates = [];
    const params = [];

    if (rating !== undefined) {
      const numRating = parseInt(rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5"
        });
      }
      updates.push("rating = ?");
      params.push(numRating);
    }

    if (review_title !== undefined) {
      updates.push("review_title = ?");
      params.push(review_title ? review_title.trim().slice(0, 255) : null);
    }

    if (review_text !== undefined) {
      if (!review_text || review_text.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Review text must be at least 3 characters"
        });
      }
      updates.push("review_text = ?");
      params.push(review_text.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update"
      });
    }

    params.push(reviewId);
    await db.query(
      `UPDATE product_reviews SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully"
    });
  } catch (error) {
    console.error("updateReview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
}

/**
 * DELETE /api/reviews/:reviewId
 * Protected: Delete a review (owner or administrator)
 */
async function deleteReview(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const reviewId = parseInt(req.params.reviewId, 10);

    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Valid review ID is required"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM product_reviews WHERE id = ? LIMIT 1",
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const review = rows[0];

    // Only owner or admin can delete
    if (review.user_id !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot delete another user's review"
      });
    }

    await db.query("DELETE FROM product_reviews WHERE id = ?", [reviewId]);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("deleteReview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
}

module.exports = {
  getProductReviews,
  createProductReview,
  updateReview,
  deleteReview
};
