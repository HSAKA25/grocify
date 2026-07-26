import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import generateToken from "../utils/generateToken.js";

// @desc  Register a new user
// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { password } = req.body;
    // Trim/lowercase so a stray space or different casing at login doesn't
    // create a "wrong password" false alarm against an otherwise-matching account.
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Is the email already registered?
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash (scramble) the password before storing — never store plain text.
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      token: generateToken(result.insertId),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Log a user in
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    // Check the user exists AND the password matches the stored hash.
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get the currently logged-in user
// @route GET /api/auth/me   (protected)
export const getMe = async (req, res) => {
  res.json(req.user); // set by the protect middleware
};
