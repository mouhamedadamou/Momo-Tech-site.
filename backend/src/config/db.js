const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATABASE_FILE = process.env.DATABASE_FILE || "./data/momo-tech.sqlite";
const resolvedPath = path.resolve(process.cwd(), DATABASE_FILE);

// S'assure que le dossier de la base existe avant de l'ouvrir
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,

    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,

    free_fire_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,

    payment_method TEXT,
    paydunya_token TEXT,
    paydunya_invoice_url TEXT,

    payment_status TEXT NOT NULL DEFAULT 'PENDING',
      -- PENDING | COMPLETED | FAILED | CANCELLED
    order_status TEXT NOT NULL DEFAULT 'En attente',
      -- En attente | Payée | En traitement | Terminée | Annulée | Échec

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
  CREATE INDEX IF NOT EXISTS idx_orders_free_fire_id ON orders(free_fire_id);
  CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
  CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
  CREATE INDEX IF NOT EXISTS idx_orders_paydunya_token ON orders(paydunya_token);
`);

module.exports = db;
