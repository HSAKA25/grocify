import { GoogleGenAI, Type } from "@google/genai";
import pool from "../config/db.js";

// Reads GEMINI_API_KEY from the environment automatically.
const ai = new GoogleGenAI({});

// @desc  Suggest recipes based on the items currently in the user's inventory
// @route GET /api/recipes/generate
export const generateRecipes = async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT name, category, quantity, unit,
              DATEDIFF(expiry_date, CURDATE()) AS daysLeft
       FROM grocery_items
       WHERE user_id = ? AND status = 'in-stock'
       ORDER BY expiry_date ASC`,
      [req.user.id]
    );

    if (items.length === 0) {
      return res
        .status(400)
        .json({ message: "Add some items to your inventory first" });
    }

    const ingredientList = items
      .map((i) => `- ${i.name} (${i.quantity} ${i.unit}, expires in ${i.daysLeft} day(s))`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Here is my current grocery inventory:\n${ingredientList}\n\nSuggest 3 recipes I can make.`,
      config: {
        systemInstruction:
          "You are a home cooking assistant. Suggest practical, easy-to-follow recipes " +
          "using mainly the ingredients the user already has, prioritizing ones that expire " +
          "soonest so nothing goes to waste. Assume common pantry staples (salt, oil, water, " +
          "basic spices) are available even if not listed.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prep_time_minutes: { type: Type.INTEGER },
                  uses_expiring_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missing_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  "title",
                  "prep_time_minutes",
                  "uses_expiring_items",
                  "ingredients",
                  "missing_ingredients",
                  "instructions",
                ],
              },
            },
          },
          required: ["recipes"],
        },
      },
    });

    const { recipes } = JSON.parse(response.text || "{}");
    res.json({ recipes: recipes || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
