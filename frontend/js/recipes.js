requireLogin();
renderNavbar("recipes");

const $ = (id) => document.getElementById(id);

$("generateBtn").addEventListener("click", async () => {
  const btn = $("generateBtn");
  const list = $("recipeList");
  btn.disabled = true;
  btn.textContent = "Thinking...";
  list.innerHTML = `<p class="muted">Looking through your inventory for ideas...</p>`;

  try {
    const { recipes } = await api.get("/recipes/generate");
    renderRecipes(recipes);
  } catch (err) {
    list.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "✨ Generate Recipes";
  }
});

function renderRecipes(recipes) {
  const list = $("recipeList");
  if (!recipes || recipes.length === 0) {
    list.innerHTML = `<p class="muted">No recipe ideas this time — try adding a few more items to your inventory.</p>`;
    return;
  }

  list.innerHTML = recipes.map((r) => `
    <div class="card">
      <div class="card-head">
        <h3>${esc(r.title)}</h3>
        <span class="pill pill-ok">${esc(r.prep_time_minutes)} min</span>
      </div>
      ${r.uses_expiring_items?.length
        ? `<p><strong>Uses up:</strong> ${r.uses_expiring_items.map(esc).join(", ")}</p>` : ""}
      <p><strong>Ingredients:</strong> ${r.ingredients.map(esc).join(", ")}</p>
      ${r.missing_ingredients?.length
        ? `<p class="muted"><strong>You'll also need:</strong> ${r.missing_ingredients.map(esc).join(", ")}</p>` : ""}
      <ol class="recipe-steps">
        ${r.instructions.map((step) => `<li>${esc(step)}</li>`).join("")}
      </ol>
    </div>
  `).join("");
}
