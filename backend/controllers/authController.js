const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * POST /api/auth/register
 * Register a new customer user account
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Full name is required"
      });
    }

    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email address is required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const cleanName = name.trim();
    // Split name into first_name and last_name for the users schema
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // 2. Check if email already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    // 3. Hash password using bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Default role: 1 (customer)
    const customerRoleId = 1;

    const insertQuery = `
      INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `;

    const [insertResult] = await db.query(insertQuery, [
      customerRoleId,
      firstName,
      lastName,
      cleanEmail,
      passwordHash
    ]);

    const newUserId = insertResult.insertId;

    return res.status(201).json({
      success: true,
      message: "Account registered successfully. Please sign in to continue.",
      user: {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        role: "customer"
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again."
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate customer credentials and return signed JWT
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, NULLIF(u.last_name, '')) AS name,
        u.email,
        u.password_hash,
        u.is_active,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;

    const [rows] = await db.query(query, [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support."
      });
    }

    // 2. Compare password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. Generate JWT with safe claims
    const jwtSecret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured in backend/.env");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error"
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again."
    });
  }
}

/**
 * GET /api/auth/me
 * Fetch verified profile for authenticated user
 */
async function getCurrentUser(req, res) {
  try {
    // req.user is set by authMiddleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        created_at: req.user.created_at
      }
    });
  } catch (error) {
    console.error("Get current user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile"
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser
};
