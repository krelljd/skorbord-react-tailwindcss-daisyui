-- 002_games.sql: Add games table (idempotent)
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
