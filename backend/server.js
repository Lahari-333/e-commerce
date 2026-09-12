const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// Normalize configured and standard allowed frontend origins
const rawFrontendOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://shop-express-jet.vercel.app"
]
  .filter(Boolean)
  .flatMap((u) => u.split(",").map((s) => s.trim().replace(/\/+$/, "")));

const allowedOriginsSet = new Set(rawFrontendOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile, server-to-server, health checks, curl)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOriginsSet.has(normalizedOrigin) ||
        normalizedOrigin.endsWith(".vercel.app") ||
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development"
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Basic API health-check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Shop Express API is healthy",
        timestamp: new Date().toISOString()
    });
});

// Database connection health-check
app.get("/api/health/db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");
        if (rows && rows.length > 0 && rows[0].connected === 1) {
            // Ensure demo customer & admin accounts have valid bcrypt hash for 'password123'
            try {
                const validHash = "$2b$10$ayJwwdUquizUbP6Z4nqRk.Fmjojrzr5T7SqDXM4GgiWtmdeC1Zz6C";
                await db.query(
                    "UPDATE users SET password_hash = ? WHERE email IN ('demo.customer@shopexpress.test', 'demo.admin@shopexpress.test') AND password_hash != ?",
                    [validHash, validHash]
                );
            } catch (syncErr) {
                console.warn("Notice: Demo hash sync skipped:", syncErr.message);
            }

            // Ensure orders table schema compatibility
            try {
                const alterStatements = [
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'cod'",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_full_name VARCHAR(255) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(255) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(255) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20) NULL",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) NULL"
                ];
                for (const sql of alterStatements) {
                    try { await db.query(sql); } catch {}
                }
            } catch (schemaErr) {
                console.warn("Notice: Orders schema check skipped:", schemaErr.message);
            }

            return res.status(200).json({
                status: "ok",
                database: "connected",
                message: "MySQL connection pool is active and operational",
                timestamp: new Date().toISOString()
            });
        }
        return res.status(500).json({
            status: "error",
            database: "disconnected",
            message: "Unexpected query response from MySQL",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Database connection check failed:", error.message);
        return res.status(503).json({
            status: "error",
            database: "disconnected",
            message: "Database connection failed",
            code: error.code || "DB_ERROR",
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", reviewRoutes);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, async () => {
    console.log(`Shop Express server running on port ${PORT}`);
    try {
        const validHash = "$2b$10$ayJwwdUquizUbP6Z4nqRk.Fmjojrzr5T7SqDXM4GgiWtmdeC1Zz6C";
        await db.query(
            "UPDATE users SET password_hash = ? WHERE email IN ('demo.customer@shopexpress.test', 'demo.admin@shopexpress.test') AND password_hash != ?",
            [validHash, validHash]
        );
        const alterStatements = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'cod'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_full_name VARCHAR(255) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(255) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(255) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) NULL"
        ];
        for (const sql of alterStatements) {
            try { await db.query(sql); } catch {}
        }
    } catch (err) {
        // Non-blocking in case tables are not initialized yet
    }
});