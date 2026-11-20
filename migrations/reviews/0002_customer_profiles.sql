CREATE TABLE IF NOT EXISTS customer_profiles (
  customer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 80),
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '' CHECK(length(email) <= 254),
  location TEXT NOT NULL DEFAULT '' CHECK(length(location) <= 200),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
