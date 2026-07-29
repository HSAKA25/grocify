# 🛒 Smart Grocery Management System (Node.js + MySQL)

A full-stack web app to manage home groceries: track inventory, get expiry alerts,
manage a shopping list, and see spending insights.

**Stack:** plain **HTML / CSS / JavaScript** frontend · **Node.js + Express** backend ·
**MySQL** database. Passwords are hashed with bcrypt and logins use JWT tokens.

This README is written for **beginners** — follow it top to bottom.

> ✅ This project has been tested end-to-end (register, login, inventory CRUD,
> expiry/stats, shopping list, auto-suggest, and AI recipe generation all verified
> against a real MySQL database and a live Gemini API key).

---

## ✨ Features

- **User accounts** — register / login with hashed passwords and JWT.
- **Inventory** — add, edit, delete groceries with category, quantity, unit, price, and expiry date.
- **Expiry tracking** — items are colour-coded (green = fresh, orange = expiring soon, red = expired) and sorted by soonest to expire.
- **Dashboard** — stat cards (in stock, expiring soon, expired, inventory value) plus a spend-by-category bar chart.
- **Shopping list** — add items, tick them off, and **✨ Auto-suggest** to fill the list from things you've used up or that expired.
- **Consumption tracking** — mark items "Used" to keep inventory accurate.
- **AI recipe ideas** — generates recipes from what's currently in your inventory (via Google Gemini), prioritizing items that expire soonest.

---

## 🧰 What you need to install first

1. **Node.js 18+** — runs the backend. Get the LTS build from https://nodejs.org.
   Verify with `node --version`.
2. **MySQL** — the database. Two easy options (pick ONE):
   - **XAMPP (recommended, easiest):** https://www.apachefriends.org — bundles MySQL
     (MariaDB) + phpMyAdmin in one installer. Start it, click **Start** next to *MySQL*.
   - **MySQL Community Server:** https://www.mysql.com/downloads (also works fine).

A code editor like **VS Code** (https://code.visualstudio.com) is recommended.

----

## 📁 Project structure

```
smart-grocery-mysql/
├── backend/                → Node + Express API
│   ├── config/
│   │   ├── db.js           → MySQL connection pool
│   │   └── schema.sql      → creates the database + tables
│   ├── controllers/        → the logic (auth, items, shopping, recipes)
│   ├── routes/             → API endpoints
│   ├── middleware/auth.js  → checks the login token
│   ├── initDb.js           → run once to build the database
│   ├── seed.js             → optional demo data
│   └── server.js           → main entry point (also serves the frontend)
│
└── frontend/               → plain HTML / CSS / JS (no framework)
    ├── index.html          → login       register.html
    ├── dashboard.html      inventory.html   shopping.html   recipes.html
    ├── css/style.css
    └── js/                 → api.js, auth.js, dashboard.js, inventory.js, shopping.js, recipes.js
```

> Note: the backend also **serves the frontend**, so you only run ONE thing and open
> ONE address. No CORS headaches.

---

## 🚀 Setup — step by step

### Step 1 — Start MySQL
If using XAMPP, open the XAMPP Control Panel and click **Start** next to **MySQL**.
(Default settings: host `localhost`, port `3306`, user `root`, password *empty*.)

### Step 2 — Configure the backend
Open a terminal in the `backend` folder:

```bash
cd backend
npm install
```

Create your environment file by copying the example:

```bash
# Mac/Linux:
cp .env.example .env
# Windows (PowerShell):
copy .env.example .env
```

Open `.env` and check the MySQL settings match your setup. For a default XAMPP install
you usually don't need to change anything except maybe leaving `DB_PASSWORD` empty:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_grocery
JWT_SECRET=any_long_random_text_here
GEMINI_API_KEY=your_gemini_api_key_here
```

For the recipe generator, get a **free** `GEMINI_API_KEY` at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) — sign in with any
Google account and click **Create API key**, no credit card needed. Without this key
set, every page works except the Recipes tab.

### Step 3 — Create the database and tables
Still in the `backend` folder, run:

```bash
npm run init-db
```

You should see `✅ Database and tables created successfully.`
(This creates a database called `smart_grocery` with three tables. You could also run
`config/schema.sql` manually in phpMyAdmin if you prefer.)

### Step 4 — (Optional) Load demo data
```bash
npm run seed
```
Creates a demo account — **email:** `demo@grocery.com`, **password:** `demo123` — with
sample groceries so you can explore right away.

### Step 5 — Start the app
```bash
npm run dev
```
You'll see: `🚀 Server running — open http://localhost:5000 in your browser`

### Step 6 — Open it
Go to **http://localhost:5000**. Register an account (or use the demo login if you
seeded) and start adding groceries! 🎉

---

## 🔌 API reference (useful for your project report)

Routes under `/api/items`, `/api/shopping`, and `/api/recipes` require an `Authorization: Bearer <token>` header.

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | `/api/auth/register`         | Create an account                  |
| POST   | `/api/auth/login`            | Log in, returns a token            |
| GET    | `/api/auth/me`               | Current user's profile             |
| GET    | `/api/items`                 | List all grocery items             |
| POST   | `/api/items`                 | Add an item                        |
| PUT    | `/api/items/:id`             | Update / mark used                 |
| DELETE | `/api/items/:id`             | Delete an item                     |
| GET    | `/api/items/expiring?days=7` | Items expiring within N days       |
| GET    | `/api/items/stats`           | Dashboard totals & spend breakdown |
| GET    | `/api/shopping`              | Get the shopping list              |
| POST   | `/api/shopping`              | Add a shopping item                |
| POST   | `/api/shopping/suggest`      | Auto-suggest items to re-buy       |
| PUT    | `/api/shopping/:id`          | Update (e.g. mark purchased)       |
| DELETE | `/api/shopping/:id`          | Remove a shopping item             |
| GET    | `/api/recipes/generate`      | AI recipe ideas from your inventory|

---

## 🗄️ Database tables

- **users** — `id, name, email (unique), password (hashed), created_at`
- **grocery_items** — `id, user_id → users, name, category, quantity, unit, price, purchase_date, expiry_date, status, created_at`
- **shopping_items** — `id, user_id → users, name, quantity, unit, purchased, source, created_at`

Both item tables link to `users` with a foreign key and `ON DELETE CASCADE` (delete a
user → their items are removed too). Full definitions are in `backend/config/schema.sql`.

---

## ❓ Troubleshooting

- **`MySQL connection failed`** → MySQL isn't running (start it in XAMPP), or the `.env`
  DB settings are wrong. Double-check `DB_USER`/`DB_PASSWORD`.
- **`Access denied for user 'root'`** → your MySQL root has a password; put it in `DB_PASSWORD` in `.env`.
- **`Unknown database 'smart_grocery'`** → you skipped `npm run init-db`. Run it.
- **`Port 5000 already in use`** → change `PORT` in `.env` to e.g. `5001`, then open that port instead.
- **Page loads but nothing saves** → make sure the terminal running `npm run dev` is still open and MySQL is started.
- **Recipes tab shows an error** → make sure `GEMINI_API_KEY` is set in `.env` (see Step 2) and restart the server after adding it.
- **Login says "Something went wrong" even with the right password** → usually stale browser data on `localhost`, not a server problem. Try an Incognito/Private window, or DevTools → Application → Storage → Clear site data for this address.

---

## 🌱 Ideas to extend it (for a stronger grade)

Barcode/QR scanning to add items; email notifications for expiring goods; predicting
when an item will run out from past usage; family/household sharing; and a monthly
expense report exportable as PDF.

Happy building! 🛒
# grocify
