import pool from "../config/db.js";

// @desc  Get the user's shopping list
// @route GET /api/shopping
export const getShoppingList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM shopping_items WHERE user_id = ? ORDER BY purchased ASC, created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Add an item to the shopping list
// @route POST /api/shopping
export const addShoppingItem = async (req, res) => {
  try {
    const { name, quantity = 1, unit = "pcs", source = "manual" } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const [result] = await pool.query(
      "INSERT INTO shopping_items (user_id, name, quantity, unit, source) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, name, quantity, unit, source]
    );
    const [rows] = await pool.query("SELECT * FROM shopping_items WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Update a shopping item (e.g. toggle purchased)
// @route PUT /api/shopping/:id
export const updateShoppingItem = async (req, res) => {
  try {
    const [existing] = await pool.query(
      "SELECT * FROM shopping_items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const current = existing[0];

    const purchased =
      req.body.purchased !== undefined
        ? req.body.purchased ? 1 : 0
        : current.purchased;
    const name = req.body.name ?? current.name;
    const quantity = req.body.quantity ?? current.quantity;
    const unit = req.body.unit ?? current.unit;

    await pool.query(
      "UPDATE shopping_items SET name=?, quantity=?, unit=?, purchased=? WHERE id=? AND user_id=?",
      [name, quantity, unit, purchased, req.params.id, req.user.id]
    );
    const [rows] = await pool.query("SELECT * FROM shopping_items WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Delete a shopping item
// @route DELETE /api/shopping/:id
export const deleteShoppingItem = async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM shopping_items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Removed", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Smart suggest: auto-add inventory items that need re-buying
// @route POST /api/shopping/suggest
export const suggestItems = async (req, res) => {
  try {
    // Items that are used up, expired, or running low (quantity <= 1).
    const [needsRebuy] = await pool.query(
      `SELECT * FROM grocery_items
       WHERE user_id = ?
         AND (status = 'used' OR expiry_date < CURDATE() OR quantity <= 1)`,
      [req.user.id]
    );

    // Names already on the shopping list, so we don't add duplicates.
    const [existing] = await pool.query(
      "SELECT name FROM shopping_items WHERE user_id = ?",
      [req.user.id]
    );
    const existingNames = existing.map((e) => e.name.toLowerCase());

    const created = [];
    for (const inv of needsRebuy) {
      if (!existingNames.includes(inv.name.toLowerCase())) {
        const [result] = await pool.query(
          "INSERT INTO shopping_items (user_id, name, quantity, unit, source) VALUES (?, ?, 1, ?, 'auto')",
          [req.user.id, inv.name, inv.unit]
        );
        created.push({ id: result.insertId, name: inv.name });
        existingNames.push(inv.name.toLowerCase());
      }
    }

    res.json({ message: `${created.length} item(s) suggested`, items: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
