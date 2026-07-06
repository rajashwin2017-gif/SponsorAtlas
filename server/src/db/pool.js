const path = require("path");
const { Pool } = require("pg");
const dotenv = require("dotenv");

// Load server/.env so DB config is correct even when this module is
// required before server.js has called dotenv.config() itself.
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sponsoratlas",
  max: Number(process.env.DB_POOL_LIMIT || 10),
});

module.exports = { pool };
