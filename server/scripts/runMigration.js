/**
 * Applies server/schema.sql to the database using credentials from server/.env.
 * Usage (from server/): npm run migrate
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const sqlPath = path.join(__dirname, "..", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const dbName = process.env.DB_NAME || "sponsoratlas";

  const baseConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true, // schema.sql has many ;-separated CREATE TABLE statements
  };

  // Connect without selecting a database first, since MySQL rejects the
  // connection outright if the target database doesn't exist yet.
  const bootstrapConn = await mysql.createConnection(baseConfig);
  try {
    await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database ready: ${dbName}`);
  } finally {
    await bootstrapConn.end();
  }

  const conn = await mysql.createConnection({ ...baseConfig, database: dbName });
  try {
    await conn.query(sql);
    console.log("Schema applied:", sqlPath);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
