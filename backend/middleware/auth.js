import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Runs before protected routes. Reads the "Authorization: Bearer <token>"
// header, verifies the token, and attaches the logged-in user to req.user.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer")) {
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Look up the user by the id stored in the token.
      const [rows] = await pool.query(
        "SELECT id, name, email FROM users WHERE id = ?",
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      req.user = rows[0];
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};
