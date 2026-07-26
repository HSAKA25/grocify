// Guard the page + draw the navbar.
requireLogin();
renderNavbar("dashboard");

async function loadDashboard() {
  try {
    const [stats, expiring] = await Promise.all([
      api.get("/items/stats"),
      api.get("/items/expiring?days=7"),
    ]);
    renderStats(stats);
    renderCategories(stats);
    renderExpiring(expiring);
  } catch (err) {
    console.error(err);
    const box = document.getElementById("error");
    box.textContent = err.message;
    box.classList.remove("hidden");
  }
}

function renderStats(stats) {
  document.getElementById("statGrid").innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalItems}</div>
      <div class="stat-label">Items in Stock</div>
    </div>
    <div class="stat-card warn">
      <div class="stat-value">${stats.expiringSoon}</div>
      <div class="stat-label">Expiring in 7 days</div>
    </div>
    <div class="stat-card danger">
      <div class="stat-value">${stats.expired}</div>
      <div class="stat-label">Expired</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">₹${stats.totalSpend.toFixed(0)}</div>
      <div class="stat-label">Inventory Value</div>
    </div>`;
}

function renderCategories(stats) {
  const cats = Object.entries(stats.byCategory || {});
  const box = document.getElementById("categoryCard");
  if (cats.length === 0) { box.innerHTML = ""; return; }

  const max = Math.max(...cats.map(([, v]) => v));
  const rows = cats.map(([cat, val]) => {
    const pct = max ? (val / max) * 100 : 0;
    return `
      <div class="bar-row">
        <span class="bar-label">${esc(cat)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="bar-value">₹${val.toFixed(0)}</span>
      </div>`;
  }).join("");

  box.innerHTML = `<div class="card"><h3>Spending by Category</h3>${rows}</div>`;
}

function renderExpiring(items) {
  const box = document.getElementById("expiringList");
  if (items.length === 0) {
    box.innerHTML = `<p class="muted">Nothing expiring in the next 7 days. 🎉</p>`;
    return;
  }
  box.innerHTML = `<ul class="expiry-list">${items.map((item) => {
    const d = item.daysLeft;
    const cls = d < 0 ? "pill-danger" : d <= 2 ? "pill-warn" : "pill-ok";
    const label = d < 0 ? `Expired ${Math.abs(d)}d ago`
      : d === 0 ? "Today" : `${d}d left`;
    return `<li><span>${esc(item.name)}</span><span class="pill ${cls}">${label}</span></li>`;
  }).join("")}</ul>`;
}

loadDashboard();
