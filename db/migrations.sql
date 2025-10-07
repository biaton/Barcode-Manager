CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  sku TEXT,
  barcode TEXT UNIQUE,
  barcode_type TEXT,
  image_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);