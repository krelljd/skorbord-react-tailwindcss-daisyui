-- 004_rivalries.sql: Add rivalries table (idempotent)
CREATE TABLE IF NOT EXISTS rivalries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team1_id INTEGER NOT NULL,
  team2_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(team1_id) REFERENCES teams(id),
  FOREIGN KEY(team2_id) REFERENCES teams(id)
);
