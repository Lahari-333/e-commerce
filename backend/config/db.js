const mysql = require("mysql2/promise");
require("dotenv").config();

// Determine connection configuration
let poolConfig;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  // Support cloud database URL connection string (e.g. Railway, Aiven, PlanetScale)
  const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  poolConfig = {
    uri: connectionUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  if (process.env.DB_SSL === "true" || process.env.MYSQL_SSL === "true") {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  // Discrete host, user, password configuration
  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "shop_express",
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  // Enable SSL if configured or required by cloud host (e.g. TiDB Cloud, Aiven)
  if (process.env.DB_SSL === "true" || process.env.MYSQL_SSL === "true") {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

// Create a connection pool with sensible production defaults
const pool = mysql.createPool(poolConfig);

module.exports = pool;
