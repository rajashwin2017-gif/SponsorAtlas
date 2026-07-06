/**
 * Applies server/schema.sql to the database using credentials from server/.env.
 * Usage (from server/): npm run migrate
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sponsoratlas",
  });

  const sqlPath = path.join(__dirname, "..", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  await client.connect();
  try {
    // node-postgres supports multiple ;-separated statements in one query
    // call, unlike mysql2 (no special multipleStatements flag needed).
    await client.query(sql);
    console.log("Schema applied:", sqlPath);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
