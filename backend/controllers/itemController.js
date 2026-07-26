import pool from "../config/db.js";

// Helper: how many days from today until the given date string (YYYY-MM-DD)?
// Built from the Y/M/D parts (not `new Date(dateStr)`) so the result is based on
// local calendar days everywhere — parsing "YYYY-MM-DD" directly treats it as UTC
// midnight, which rolls back to the previous local day in timezones behind UTC.
const daysUntil = (dateStr) => {
  const oneDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  return Math.round((target - today) / oneDay);
};

// Attach a computed daysLeft field so the frontend can colour-code items.
const withDaysLeft = (rows) =>
  rows.map((item) => ({ ...item, daysLeft: daysUntil(item.expiry_date) }));

// @desc  Get all items for the logged-in user
// @route GET /api/items
export const getItems = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM grocery_items WHERE user_id = ? ORDER BY expiry_date ASC",
      [req.user.id]
    );
    res.json(withDaysLeft(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get items expiring within N days (default 7), still in stock
// @route GET /api/items/expiring?days=7
export const getExpiringItems = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const [rows] = await pool.query(
      `SELECT * FROM grocery_items
       WHERE user_id = ?
         AND status = 'in-stock'
         AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY expiry_date ASC`,
      [req.user.id, days]
    );
    res.json(withDaysLeft(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create a new item
// @route POST /api/items
export const createItem = async (req, res) => {
  try {
    const {
      name,
      category = "Other",
      quantity = 1,
      unit = "pcs",
      price = 0,
      purchase_date = null,
      expiry_date,
    } = req.body;

    if (!name || !expiry_date) {
      return res
        .status(400)
        .json({ message: "Name and expiry date are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO grocery_items
        (user_id, name, category, quantity, unit, price, purchase_date, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURDATE()), ?)`,
      [req.user.id, name, category, quantity, unit, price, purchase_date, expiry_date]
    );

    const [rows] = await pool.query("SELECT * FROM grocery_items WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(withDaysLeft(rows)[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Update an item (edit fields or change status)
// @route PUT /api/items/:id
export const updateItem = async (req, res) => {
  try {
    // Confirm the item exists and belongs to this user.
    const [existing] = await pool.query(
      "SELECT * FROM grocery_items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const current = existing[0];

    // Use the new value if provided, otherwise keep the current one.
    const merged = {
      name: req.body.name ?? current.name,
      category: req.body.category ?? current.category,
      quantity: req.body.quantity ?? current.quantity,
      unit: req.body.unit ?? current.unit,
      price: req.body.price ?? current.price,
      expiry_date: req.body.expiry_date ?? current.expiry_date,
      status: req.body.status ?? current.status,
    };

    await pool.query(
      `UPDATE grocery_items
       SET name=?, category=?, quantity=?, unit=?, price=?, expiry_date=?, status=?
       WHERE id=? AND user_id=?`,
      [
        merged.name, merged.category, merged.quantity, merged.unit,
        merged.price, merged.expiry_date, merged.status,
        req.params.id, req.user.id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM grocery_items WHERE id = ?", [
      req.params.id,
    ]);
    res.json(withDaysLeft(rows)[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Delete an item
// @route DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM grocery_items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item removed", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Dashboard stats
// @route GET /api/items/stats
export const getStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM grocery_items WHERE user_id = ?",
      [req.user.id]
    );

    const inStock = rows.filter((i) => i.status === "in-stock");
    const expiringSoon = inStock.filter((i) => {
      const d = daysUntil(i.expiry_date);
      return d >= 0 && d <= 7;
    });
    const expired = inStock.filter((i) => daysUntil(i.expiry_date) < 0);

    const totalSpend = inStock.reduce(
      (sum, i) => sum + Number(i.price) * Number(i.quantity),
      0
    );

    const byCategory = {};
    inStock.forEach((i) => {
      const val = Number(i.price) * Number(i.quantity);
      byCategory[i.category] = (byCategory[i.category] || 0) + val;
    });

    res.json({
      totalItems: inStock.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      usedCount: rows.filter((i) => i.status === "used").length,
      totalSpend,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
