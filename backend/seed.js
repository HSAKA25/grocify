// Optional: run `npm run seed` to insert a demo user + sample groceries.
// Login afterwards with  demo@grocery.com / demo123
import bcrypt from "bcryptjs";
import pool from "./config/db.js";

const run = async () => {
  const email = "demo@grocery.com";

  // Remove any previous demo user (ON DELETE CASCADE clears their items too).
  await pool.query("DELETE FROM users WHERE email = ?", [email]);

  const hashed = await bcrypt.hash("demo123", 10);
  const [userResult] = await pool.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    ["Demo User", email, hashed]
  );
  const userId = userResult.insertId;

  // Build a set of sample items with expiry dates relative to today.
  const items = [
    ["Milk", "Dairy", 2, "litre", 60, 2],
    ["Bread", "Grains", 1, "packet", 40, 4],
    ["Eggs", "Dairy", 12, "pcs", 84, 15],
    ["Tomatoes", "Produce", 1, "kg", 30, 1],
    ["Chicken", "Meat", 500, "g", 120, -1], // already expired
    ["Rice", "Grains", 5, "kg", 300, 180],
    ["Orange Juice", "Beverages", 1, "litre", 110, 6],
  ];

  for (const [name, category, qty, unit, price, offset] of items) {
    await pool.query(
      `INSERT INTO grocery_items
        (user_id, name, category, quantity, unit, price, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
      [userId, name, category, qty, unit, price, offset]
    );
  }

  await pool.query(
    "INSERT INTO shopping_items (user_id, name, quantity, unit) VALUES (?, 'Butter', 1, 'packet'), (?, 'Apples', 1, 'kg')",
    [userId, userId]
  );

  console.log("✅ Seed complete! Login with:  demo@grocery.com  /  demo123");
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
