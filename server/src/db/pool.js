const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load server/.env so DB config is correct even when this module is
// required before server.js has called dotenv.config() itself.
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sponsoratlas",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  timezone: "+00:00", // treat all DATETIME columns as UTC
});

module.exports = { pool };
