const db = require("../config/db");

/**
 * GET /api/categories
 * Retrieve all active categories with essential display fields
 */
async function getCategories(req, res) {
  try {
    const query = `
      SELECT 
        id,
        name,
        slug,
        description
      FROM categories
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;

    const [categories] = await db.query(query);

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error("Error in getCategories:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve categories"
    });
  }
}

module.exports = {
  getCategories
};
