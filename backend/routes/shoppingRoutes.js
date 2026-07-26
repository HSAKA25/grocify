import express from "express";
import {
  getShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  suggestItems,
} from "../controllers/shoppingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getShoppingList);
router.post("/", addShoppingItem);
router.post("/suggest", suggestItems);
router.put("/:id", updateShoppingItem);
router.delete("/:id", deleteShoppingItem);

export default router;
