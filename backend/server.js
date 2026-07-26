import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { testConnection } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import shoppingRoutes from "./routes/shoppingRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Make sure the database is reachable before we start serving.
testConnection();

const app = express();

app.use(cors());
app.use(express.json());

// ----- API routes -----
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/recipes", recipeRoutes);

// ----- Serve the frontend -----
// The plain HTML/CSS/JS site lives in ../frontend. Serving it from the same
// server means no CORS issues and just ONE address to open in the browser.
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Any non-API route falls back to the login page.
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running — open http://localhost:${PORT} in your browser`)
);
