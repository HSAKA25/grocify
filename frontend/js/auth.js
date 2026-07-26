// ----- Shared auth helpers used across pages -----

// Put this at the top of protected pages: if not logged in, bounce to login.
function requireLogin() {
  const user = getUser();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// Build the shared navbar and drop it into <div id="nav"></div>.
function renderNavbar(active) {
  const user = getUser();
  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const nav = document.getElementById("nav");
  if (!nav) return;

  const link = (href, label, key) =>
    `<a class="nav-link ${active === key ? "active" : ""}" href="${href}">${label}</a>`;

  nav.outerHTML = `
    <nav class="navbar">
      <div class="nav-brand">🛒 Grocify</div>
      <div class="nav-links">
        ${link("dashboard.html", "Dashboard", "dashboard")}
        ${link("inventory.html", "Inventory", "inventory")}
        ${link("shopping.html", "Shopping List", "shopping")}
        ${link("recipes.html", "Recipes", "recipes")}
      </div>
      <div class="nav-user">
        <span>Hi, ${firstName}</span>
        <button class="btn btn-sm btn-outline" id="logoutBtn">Logout</button>
      </div>
    </nav>`;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearUser();
    window.location.href = "index.html";
  });
}

// Small utility to safely escape text before putting it in HTML.
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
