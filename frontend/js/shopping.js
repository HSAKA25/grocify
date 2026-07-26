requireLogin();
renderNavbar("shopping");

const $ = (id) => document.getElementById(id);

populateUnitSelect($("unit"), "pcs");
$("unit").addEventListener("change", () => {
  $("quantity").step = unitMeta($("unit").value).step;
});
$("quantity").step = unitMeta($("unit").value).step;

// Shared banner: green for status messages, red for errors. Reuses the
// existing #message box so we don't need a separate error element per page.
function flash(text, isError = false) {
  const el = $("message");
  el.textContent = text;
  el.className = `alert ${isError ? "alert-error" : "alert-info"}`;
  el.classList.remove("hidden");
  if (!isError) setTimeout(() => el.classList.add("hidden"), 3000);
}

async function loadList() {
  try {
    const list = await api.get("/shopping");
    const pending = list.filter((i) => !i.purchased);
    const done = list.filter((i) => i.purchased);

    $("pendingTitle").textContent = `To Buy (${pending.length})`;
    $("pendingList").innerHTML =
      pending.length === 0
        ? `<p class="muted">Your list is empty. Add items or use auto-suggest.</p>`
        : `<ul class="check-list">${pending.map(rowHtml).join("")}</ul>`;

    const doneCard = $("doneCard");
    if (done.length === 0) {
      doneCard.classList.add("hidden");
    } else {
      doneCard.classList.remove("hidden");
      $("doneTitle").textContent = `Purchased (${done.length})`;
      $("doneList").innerHTML = `<ul class="check-list">${done.map(rowHtml).join("")}</ul>`;
    }

    wireRows();
  } catch (err) {
    flash(err.message, true);
  }
}

function rowHtml(item) {
  const autoTag = item.source === "auto" ? `<em class="auto-tag">auto</em>` : "";
  return `<li class="${item.purchased ? "done" : ""}">
    <label>
      <input type="checkbox" data-act="toggle" data-id="${item.id}" ${item.purchased ? "checked" : ""} />
      <span>${esc(item.name)} <small>— ${esc(formatQty(item.quantity, item.unit))}</small>${autoTag}</span>
    </label>
    <button class="btn btn-xs btn-danger" data-act="del" data-id="${item.id}">✕</button>
  </li>`;
}

function wireRows() {
  document.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener(el.dataset.act === "toggle" ? "change" : "click", async () => {
      try {
        if (el.dataset.act === "toggle") {
          await api.put("/shopping/" + el.dataset.id, { purchased: el.checked });
        } else {
          await api.del("/shopping/" + el.dataset.id);
        }
        loadList();
      } catch (err) {
        flash(err.message, true);
      }
    });
  });
}

$("shoppingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api.post("/shopping", {
      name: $("name").value,
      quantity: $("quantity").value,
      unit: $("unit").value,
    });
    $("shoppingForm").reset();
    $("quantity").value = 1;
    $("unit").value = "pcs";
    $("quantity").step = unitMeta("pcs").step;
    loadList();
  } catch (err) {
    flash(err.message, true);
  }
});

$("suggestBtn").addEventListener("click", async () => {
  try {
    const res = await api.post("/shopping/suggest");
    flash(res.message);
    loadList();
  } catch (err) {
    flash(err.message, true);
  }
});

loadList();
