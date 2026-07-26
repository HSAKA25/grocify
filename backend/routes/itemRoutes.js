import express from "express";
import {
  getItems,
  getExpiringItems,
  createItem,
  updateItem,
  deleteItem,
  getStats,
} from "../controllers/itemController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // everything below requires a valid login token

router.get("/", getItems);
router.post("/", createItem);
router.get("/stats", getStats);
router.get("/expiring", getExpiringItems);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
