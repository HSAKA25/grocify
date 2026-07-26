requireLogin();
renderNavbar("inventory");

let allItems = [];
let editingId = null;

const $ = (id) => document.getElementById(id);
const errorBox = $("error");

populateUnitSelect($("unit"), "pcs");

// Keep the qty step, quick-pick chips, and price label in sync with the
// chosen unit (whole pieces vs. fractional kg/L, like real grocery apps do).
function onUnitChange() {
  const meta = unitMeta($("unit").value);
  $("quantity").step = meta.step;
  $("priceUnitLabel").textContent = `per ${meta.short}`;
  renderQtyQuick(meta);
  updateValueHint();
}

function renderQtyQuick(meta) {
  const box = $("qtyQuick");
  box.innerHTML = meta.quick
    .map((q) => `<button type="button" class="qty-chip" data-qty="${q}">${q} ${meta.short}</button>`)
    .join("");
  box.querySelectorAll(".qty-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("quantity").value = btn.dataset.qty;
      updateValueHint();
    });
  });
}

// Live "X total value at ₹Y/unit" hint, similar to the unit-price callouts
// grocery sites show next to a product's price.
function updateValueHint() {
  const qty = Number($("quantity").value) || 0;
  const price = Number($("price").value) || 0;
  const meta = unitMeta($("unit").value);
  $("valueHint").textContent =
    `${formatMoney(price)} / ${meta.short} · ≈ ${formatMoney(qty * price)} total for ${qty} ${meta.short}`;
}

$("unit").addEventListener("change", onUnitChange);
$("quantity").addEventListener("input", updateValueHint);
$("price").addEventListener("input", updateValueHint);
onUnitChange();

function showError(err) {
  errorBox.textContent = err.message;
  errorBox.classList.remove("hidden");
}

async function loadItems() {
  try {
    allItems = await api.get("/items");
    renderTable();
  } catch (err) {
    showError(err);
  }
}

function renderTable() {
  const term = $("search").value.toLowerCase();
  const items = allItems.filter((i) => i.name.toLowerCase().includes(term));
  const box = $("tableWrap");

  if (items.length === 0) {
    box.innerHTML = `<p class="muted">No items yet. Add your first grocery above!</p>`;
    return;
  }

  const rows = items.map((item) => {
    const d = item.daysLeft;
    let badge;
    if (item.status === "used") badge = `<span class="pill pill-muted">Used</span>`;
    else if (d < 0) badge = `<span class="pill pill-danger">Expired</span>`;
    else if (d <= 2) badge = `<span class="pill pill-warn">${d}d left</span>`;
    else badge = `<span class="pill pill-ok">${d}d left</span>`;

    const usedBtn = item.status !== "used"
      ? `<button class="btn btn-xs btn-outline" data-act="used" data-id="${item.id}">Used</button>` : "";

    return `<tr class="${item.status === "used" ? "row-muted" : ""}">
      <td>${esc(item.name)}</td>
      <td><span class="cat-tag">${esc(item.category)}</span></td>
      <td>${esc(formatQty(item.quantity, item.unit))}</td>
      <td>
        ${formatMoney(item.price)}<span class="price-sub">/${esc(unitMeta(item.unit).short)}</span>
        <div class="value-sub">≈ ${formatMoney(item.price * item.quantity)} total</div>
      </td>
      <td>${item.expiry_date}</td>
      <td>${badge}</td>
      <td class="actions">
        ${usedBtn}
        <button class="btn btn-xs btn-outline" data-act="edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-xs btn-danger" data-act="del" data-id="${item.id}">Delete</button>
      </td>
    </tr>`;
  }).join("");

  box.innerHTML = `<table class="table">
    <thead><tr>
      <th>Name</th><th>Category</th><th>Qty</th><th>Price</th>
      <th>Expiry</th><th>Status</th><th>Actions</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

  // Wire up the action buttons.
  box.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => handleAction(btn.dataset.act, btn.dataset.id));
  });
}

function handleAction(act, id) {
  const item = allItems.find((i) => String(i.id) === String(id));
  if (act === "del") return removeItem(id);
  if (act === "used") return markUsed(id);
  if (act === "edit") return startEdit(item);
}

async function removeItem(id) {
  if (!confirm("Delete this item?")) return;
  try {
    await api.del("/items/" + id);
    loadItems();
  } catch (err) {
    showError(err);
  }
}

async function markUsed(id) {
  try {
    await api.put("/items/" + id, { status: "used" });
    loadItems();
  } catch (err) {
    showError(err);
  }
}

function startEdit(item) {
  editingId = item.id;
  $("name").value = item.name;
  $("category").value = item.category;
  $("quantity").value = item.quantity;
  $("unit").value = UNIT_MAP[item.unit] ? item.unit : "pcs";
  $("price").value = item.price;
  $("expiry_date").value = item.expiry_date;
  $("formTitle").textContent = "✏️ Edit Item";
  $("submitBtn").textContent = "Update";
  $("cancelBtn").classList.remove("hidden");
  onUnitChange();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  editingId = null;
  $("itemForm").reset();
  $("category").value = "Other";
  $("quantity").value = 1;
  $("unit").value = "pcs";
  $("price").value = 0;
  $("formTitle").textContent = "➕ Add Item";
  $("submitBtn").textContent = "Add";
  $("cancelBtn").classList.add("hidden");
  onUnitChange();
}

$("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("hidden");
  const payload = {
    name: $("name").value,
    category: $("category").value,
    quantity: $("quantity").value,
    unit: $("unit").value,
    price: $("price").value,
    expiry_date: $("expiry_date").value,
  };
  try {
    if (editingId) await api.put("/items/" + editingId, payload);
    else await api.post("/items", payload);
    resetForm();
    loadItems();
  } catch (err) {
    showError(err);
  }
});

$("cancelBtn").addEventListener("click", resetForm);
$("search").addEventListener("input", renderTable);

loadItems();
