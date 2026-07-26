// ----- Small helper for talking to the backend API -----
// Because the frontend is served by the same Express server, we can use a
// relative "/api" base — no need to hardcode localhost.

const API_BASE = "/api";

// Read the saved logged-in user (with token) from the browser.
function getUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted/stale data from an older version of the app — clear it
    // instead of throwing, so the user just gets sent back to the login page.
    localStorage.removeItem("user");
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem("user");
}

// A wrapper around fetch that automatically:
//  - sends JSON
//  - attaches the login token
//  - throws a readable error if the response isn't OK
async function apiFetch(path, options = {}) {
  const user = getUser();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (user && user.token) headers.Authorization = `Bearer ${user.token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  // If our token expired / is invalid, send the user back to login.
  if (res.status === 401 && !path.startsWith("/auth")) {
    clearUser();
    window.location.href = "index.html";
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// Shorthand helpers
const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body || {}) }),
  put: (path, body) => apiFetch(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  del: (path) => apiFetch(path, { method: "DELETE" }),
};
