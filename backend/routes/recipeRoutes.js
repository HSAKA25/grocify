import express from "express";
import { generateRecipes } from "../controllers/recipeController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // requires a valid login token

router.get("/generate", generateRecipes);

export default router;
