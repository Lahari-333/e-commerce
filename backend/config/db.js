const mysql = require("mysql2/promise");
require("dotenv").config();

// Determine connection configuration
let poolConfig;

const isCloudHost =
  (process.env.DB_HOST && process.env.DB_HOST.includes("tidbcloud.com")) ||
  Number(process.env.DB_PORT) === 4000;
const requireSsl =
  process.env.DB_SSL === "true" ||
  process.env.MYSQL_SSL === "true" ||
  isCloudHost;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  // Support cloud database URL connection string (e.g. Railway, Aiven, PlanetScale)
  const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  poolConfig = {
    uri: connectionUrl,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15000,
  };
  if (requireSsl) {
    poolConfig.ssl = {
      minVersion: "TLSv1.2",
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ? false : true,
    };
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
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15000,
  };

  // Enable SSL if configured or required by cloud host (e.g. TiDB Cloud, Aiven)
  if (requireSsl) {
    poolConfig.ssl = {
      minVersion: "TLSv1.2",
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ? false : true,
    };
  }
}

// Create a connection pool with sensible production defaults
const pool = mysql.createPool(poolConfig);

module.exports = pool;
