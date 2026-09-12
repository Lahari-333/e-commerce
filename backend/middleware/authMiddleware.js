const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * Authentication Middleware
 * Protects routes by validating the Bearer JWT from Authorization header
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing from authorization header"
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "shop_express_secure_jwt_fallback_secret_prod_key_2026";

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Fetch user from MySQL database to ensure they are still active
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS name,
        u.email,
        r.name AS role,
        u.is_active,
        u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `;

    const [rows] = await db.query(query, [decoded.id]);

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: "User account does not exist or has been deactivated"
      });
    }

    // Attach sanitized user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error"
    });
  }
}

module.exports = {
  authenticateToken
};
