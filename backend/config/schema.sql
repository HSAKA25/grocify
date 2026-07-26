-- ============================================================
--  Smart Grocery Management System — MySQL schema
--  You can run this file in phpMyAdmin, MySQL Workbench, or the
--  mysql command line. The backend's `npm run init-db` also runs it.
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_grocery
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_grocery;

-- ----- Users -----
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- stored as a bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----- Grocery inventory items -----
CREATE TABLE IF NOT EXISTS grocery_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  name          VARCHAR(150) NOT NULL,
  category      ENUM('Dairy','Produce','Meat','Grains','Beverages',
                     'Snacks','Frozen','Household','Other') DEFAULT 'Other',
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit          VARCHAR(30) DEFAULT 'pcs',
  price         DECIMAL(10,2) DEFAULT 0,
  purchase_date DATE DEFAULT (CURRENT_DATE),
  expiry_date   DATE NOT NULL,
  status        ENUM('in-stock','used','expired') DEFAULT 'in-stock',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----- Shopping list items -----
CREATE TABLE IF NOT EXISTS shopping_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(150) NOT NULL,
  quantity   DECIMAL(10,2) DEFAULT 1,
  unit       VARCHAR(30) DEFAULT 'pcs',
  purchased  TINYINT(1) DEFAULT 0,
  source     ENUM('manual','auto') DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Helpful indexes for faster lookups by user
CREATE INDEX idx_items_user   ON grocery_items(user_id);
CREATE INDEX idx_shopping_user ON shopping_items(user_id);
