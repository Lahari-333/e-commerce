const db = require("../config/db");

/**
 * GET /api/products
 * Retrieve active products with optional filters:
 * - ?search=... (matches name, description, short_description)
 * - ?category=... (matches category slug or category_id)
 * - ?featured=true (matches is_featured = TRUE)
 */
/**
 * GET /api/products
 * Retrieve active products with optional filters, sorting, and pagination:
 * - ?search=... (matches name, description, short_description)
 * - ?category=... (matches category slug or category_id)
 * - ?featured=true (matches is_featured = TRUE)
 * - ?sort=default|newest|price-asc|price-desc|name-asc|rating-desc
 * - ?minPrice=... / ?min_price=...
 * - ?maxPrice=... / ?max_price=...
 * - ?page=1
 * - ?limit=12 (max 50)
 */
async function getProducts(req, res) {
  try {
    const { search, category, featured } = req.query;

    // 1. Price Range Validation & Sanitization
    const rawMinPrice = req.query.minPrice !== undefined ? req.query.minPrice : req.query.min_price;
    const rawMaxPrice = req.query.maxPrice !== undefined ? req.query.maxPrice : req.query.max_price;

    let parsedMin = null;
    let parsedMax = null;

    if (rawMinPrice !== undefined && rawMinPrice !== "" && rawMinPrice !== null) {
      const minNum = Number(rawMinPrice);
      if (isNaN(minNum) || minNum < 0) {
        return res.status(400).json({
          success: false,
          message: "minPrice must be a valid non-negative number"
        });
      }
      parsedMin = minNum;
    }

    if (rawMaxPrice !== undefined && rawMaxPrice !== "" && rawMaxPrice !== null) {
      const maxNum = Number(rawMaxPrice);
      if (isNaN(maxNum) || maxNum < 0) {
        return res.status(400).json({
          success: false,
          message: "maxPrice must be a valid non-negative number"
        });
      }
      parsedMax = maxNum;
    }

    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice"
      });
    }

    // 2. Pagination Parameters Sanitization
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || limit < 1) {
      limit = 12;
    }
    if (limit > 50) {
      limit = 50;
    }

    const offset = (page - 1) * limit;

    // 3. Build WHERE conditions & parameters
    const whereConditions = ["p.is_active = TRUE"];
    const whereParams = [];

    // Optional category filter (by slug or numeric category_id)
    if (category) {
      if (!isNaN(category)) {
        whereConditions.push("(p.category_id = ? OR c.slug = ?)");
        whereParams.push(Number(category), category);
      } else {
        whereConditions.push("c.slug = ?");
        whereParams.push(category);
      }
    }

    // Optional search filter (case-insensitive partial match)
    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push("(p.name LIKE ? OR p.short_description LIKE ? OR p.description LIKE ?)");
      whereParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Optional featured filter
    if (featured === "true" || featured === "1") {
      whereConditions.push("p.is_featured = TRUE");
    }

    // Optional price range filter (using actual effective selling price)
    if (parsedMin !== null) {
      whereConditions.push("COALESCE(p.discount_price, p.base_price) >= ?");
      whereParams.push(parsedMin);
    }

    if (parsedMax !== null) {
      whereConditions.push("COALESCE(p.discount_price, p.base_price) <= ?");
      whereParams.push(parsedMax);
    }

    const whereSql = " WHERE " + whereConditions.join(" AND ");

    // 4. Safe Sorting Allowlist (prevents SQL injection)
    const sortParam = (req.query.sort || "default").toString().toLowerCase().trim();
    let orderByClause;

    switch (sortParam) {
      case "newest":
        orderByClause = "p.created_at DESC, p.id DESC";
        break;
      case "price-asc":
      case "price-low":
      case "price_asc":
        orderByClause = "COALESCE(p.discount_price, p.base_price) ASC, p.id ASC";
        break;
      case "price-desc":
      case "price-high":
      case "price_desc":
        orderByClause = "COALESCE(p.discount_price, p.base_price) DESC, p.id DESC";
        break;
      case "name-asc":
      case "name":
      case "name_asc":
        orderByClause = "p.name ASC, p.id ASC";
        break;
      case "name-desc":
      case "name_desc":
        orderByClause = "p.name DESC, p.id DESC";
        break;
      case "rating-desc":
      case "highest-rated":
      case "rating":
      case "rating_desc":
        orderByClause = "COALESCE(r_stat.avg_rating, 0) DESC, COALESCE(r_stat.review_count, 0) DESC, p.id DESC";
        break;
      case "default":
      case "relevance":
      default:
        orderByClause = "p.is_featured DESC, p.created_at DESC, p.id DESC";
        break;
    }

    // 5. Total Count Query (for accurate pagination metadata)
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
    `;
    const [countRows] = await db.query(countQuery, [...whereParams]);
    const totalProducts = Number(countRows[0]?.total || 0);
    const totalPages = Math.ceil(totalProducts / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 6. Data Query with Joins, Rating Aggregate, Order By, and Limit / Offset
    const dataQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.base_price,
        p.discount_price,
        COALESCE(p.discount_price, p.base_price) AS effective_price,
        p.is_featured,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        ) AS primary_image,
        ROUND(COALESCE(r_stat.avg_rating, 0), 1) AS avg_rating,
        COALESCE(r_stat.review_count, 0) AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT 
          product_id, 
          AVG(rating) AS avg_rating, 
          COUNT(id) AS review_count 
        FROM product_reviews 
        WHERE is_active = TRUE 
        GROUP BY product_id
      ) r_stat ON r_stat.product_id = p.id
      ${whereSql}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...whereParams, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    // Format products with structured category and rating details
    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      short_description: p.short_description,
      description: p.description,
      base_price: p.base_price,
      discount_price: p.discount_price,
      effective_price: Number(p.effective_price),
      is_featured: Boolean(p.is_featured),
      category_id: p.category_id,
      category: p.category_id
        ? {
            id: p.category_id,
            name: p.category_name,
            slug: p.category_slug
          }
        : null,
      primary_image: p.primary_image || null,
      avg_rating: Number(p.avg_rating) || 0,
      review_count: Number(p.review_count) || 0
    }));

    return res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      limit,
      data: products
    });
  } catch (error) {
    console.error("Error in getProducts:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products"
    });
  }
}

/**
 * GET /api/products/featured
 * Retrieve active featured products
 */
async function getFeaturedProducts(req, res) {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.base_price,
        p.discount_price,
        p.is_featured,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC 
          LIMIT 1
        ) AS primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE AND p.is_featured = TRUE
      ORDER BY p.created_at DESC, p.id DESC
    `;

    const [rows] = await db.query(query);

    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      short_description: p.short_description,
      description: p.description,
      base_price: p.base_price,
      discount_price: p.discount_price,
      is_featured: Boolean(p.is_featured),
      category_id: p.category_id,
      category: p.category_id
        ? {
            id: p.category_id,
            name: p.category_name,
            slug: p.category_slug
          }
        : null,
      primary_image: p.primary_image || null
    }));

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error("Error in getFeaturedProducts:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve featured products"
    });
  }
}

/**
 * GET /api/products/:slug
 * Retrieve one product by slug (or numeric ID fallback) with complete details
 */
async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Product slug is required"
      });
    }

    const isNumeric = !isNaN(slug) && Number.isInteger(Number(slug));
    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.base_price,
        p.discount_price,
        p.is_featured,
        p.is_active,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (p.slug = ? ${isNumeric ? "OR p.id = ?" : ""}) AND p.is_active = TRUE
    `;

    const queryParams = isNumeric ? [slug, Number(slug)] : [slug];
    const [productRows] = await db.query(productQuery, queryParams);

    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productRows[0];
    const productId = product.id;

    // Fetch all product images
    const imagesQuery = `
      SELECT 
        id,
        variant_id,
        image_url,
        alt_text,
        is_primary,
        sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    const [images] = await db.query(imagesQuery, [productId]);

    // Fetch product variants
    const variantsQuery = `
      SELECT 
        id,
        sku,
        variant_name,
        price_modifier,
        is_active
      FROM product_variants
      WHERE product_id = ? AND is_active = TRUE
      ORDER BY id ASC
    `;
    const [variants] = await db.query(variantsQuery, [productId]);

    // Fetch inventory levels
    const inventoryQuery = `
      SELECT 
        id,
        variant_id,
        quantity,
        reserved_quantity,
        (quantity - reserved_quantity) AS available_quantity,
        low_stock_threshold
      FROM inventory
      WHERE product_id = ?
    `;
    const [inventoryRows] = await db.query(inventoryQuery, [productId]);

    const inventoryItems = inventoryRows.map((inv) => {
      const available = Math.max(0, inv.available_quantity);
      return {
        variant_id: inv.variant_id,
        available_quantity: available,
        in_stock: available > 0,
        is_low_stock: available <= inv.low_stock_threshold
      };
    });

    const totalAvailable = inventoryItems.reduce((acc, item) => acc + item.available_quantity, 0);

    return res.status(200).json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        short_description: product.short_description,
        description: product.description,
        base_price: product.base_price,
        discount_price: product.discount_price,
        is_featured: Boolean(product.is_featured),
        is_active: Boolean(product.is_active),
        category: product.category_id
          ? {
              id: product.category_id,
              name: product.category_name,
              slug: product.category_slug,
              description: product.category_description
            }
          : null,
        images,
        variants,
        inventory: {
          in_stock: totalAvailable > 0,
          total_available: totalAvailable,
          items: inventoryItems
        },
        created_at: product.created_at,
        updated_at: product.updated_at
      }
    });
  } catch (error) {
    console.error("Error in getProductBySlug:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details"
    });
  }
}

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug
};
