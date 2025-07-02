-- 003_game_types.sql: Add game_types table (idempotent)
CREATE TABLE IF NOT EXISTS game_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
