import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// A connection "pool" keeps a set of ready DB connections so the app is fast.
// We use the promise-based API so we can use async/await everywhere.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_grocery",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATE columns as "YYYY-MM-DD" strings, not JS Dates
});

// Quick check on startup so you see a clear message if the DB is unreachable.
export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected to database "${process.env.DB_NAME}"`);
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("   Check your .env DB settings and that MySQL is running.");
    process.exit(1);
  }
};

export default pool;
