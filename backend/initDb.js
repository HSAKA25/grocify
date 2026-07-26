// Run with:  npm run init-db
// Creates the database and all tables by executing config/schema.sql.
// Handy so beginners don't have to open phpMyAdmin manually.
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  // Connect WITHOUT selecting a database (the script creates it).
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true, // allow running the whole .sql file at once
  });

  const sql = fs.readFileSync(path.join(__dirname, "config", "schema.sql"), "utf8");
  await connection.query(sql);

  console.log("✅ Database and tables created successfully.");
  await connection.end();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Failed to initialise database:", err.message);
  process.exit(1);
});
