const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// GET /api/products/featured - Retrieve active featured products
router.get("/featured", productController.getFeaturedProducts);

// GET /api/products - Retrieve all active products with filters (?search=, ?category=, ?featured=)
router.get("/", productController.getProducts);

// GET /api/products/:slug - Retrieve single product by slug (or id fallback)
router.get("/:slug", productController.getProductBySlug);

module.exports = router;
