# Skorbord Card App: DuckDB Data Model & Persistence Hierarchy

This document explains the core objects, their hierarchy, and the features that need to be persisted in a DuckDB database for the Skorbord Card Scoring App.

---

## Core Objects & Hierarchy

### 1. Sqid (Session)

- **Purpose:** Uniquely identifies each scoreboard session; all data is isolated per Sqid.
- **Hierarchy:** Top-level object; all other objects are scoped to a Sqid.

### 2. Game

- **Fields:** id, sqid_id (FK), game_type_id (FK), start_time, end_time, finalized, win_condition, loss_condition, winner_id, etc.
- **Hierarchy:** Belongs to a Sqid; has many Players, Scores, and is associated with a GameType and Rivalry.

### 3. GameType

- **Fields:** id, name, default_win_condition, default_loss_condition, is_win_condition (bool), favorited (per Sqid), etc.
- **Hierarchy:** Global or per Sqid; referenced by Games and Rivalries.

### 4. Player

- **Fields:** id, sqid_id (FK), name, created_at, etc.
- **Hierarchy:** Belongs to a Sqid; can participate in many Games.

### 5. Rivalry

- **Fields:** id, sqid_id (FK), game_type_id (FK), player_ids (array or join table), stats (see below), etc.
- **Hierarchy:** Belongs to a Sqid and GameType; aggregates stats across Games.

### 6. Score

- **Fields:** id, game_id (FK), player_id (FK), value, timestamp, etc.
- **Hierarchy:** Belongs to a Game; associated with a Player.

### 7. Stats (RivalryStats)

- **Fields:** rivalry_id (FK), avg_margin, last_10_results (string), min_win_margin, max_win_margin, min_loss_margin, max_loss_margin, etc.
- **Hierarchy:** Belongs to a Rivalry; updated when a Game is finalized.

### 8. Favorites

- **Fields:** sqid_id (FK), game_type_id (FK)
- **Hierarchy:** Many-to-many between Sqid and GameType; used for random game selection.

---

## Features to Persist

- **Sessions (Sqids):** All data is partitioned by session.
- **Games:** Each game instance, including type, players, scores, and finalization status.
- **Game Types:** Predefined and user-added game types, with win/loss conditions and favorited status.
- **Players:** All players, their names, and association to sessions and games.
- **Rivalries:** Player rivalries, their participants, and associated stats.
- **Scores:** All score changes, including timestamps for real-time updates and undo/redo.
- **Rivalry Stats:** Aggregated statistics for each rivalry, updated after each game.
- **Favorites:** User-favorited game types for each session.
- **Randomizer:** Uses the Favorites table to select a random game type.
- **Audit/History (optional):** For tracking changes, debugging, or analytics.

---

## Relationships (ERD-style summary)

- **Sqid** 1---* **Game**
- **Sqid** 1---* **Player**
- **Sqid** 1---* **Rivalry**
- **GameType** 1---* **Game**
- **GameType** 1---* **Rivalry**

---

## Recommended Indexes (DuckDB SQL)

```sql
-- Primary keys (ART index is created automatically)
CREATE TABLE sqid (
    id UUID PRIMARY KEY
    -- ...other fields...
);
CREATE TABLE player (
    id UUID PRIMARY KEY,
    sqid_id UUID REFERENCES sqid(id)
    -- ...other fields...
);
CREATE TABLE game (
    id UUID PRIMARY KEY,
    sqid_id UUID REFERENCES sqid(id),
    game_type_id UUID REFERENCES game_type(id)
    -- ...other fields...
);
-- Indexes for fast lookups and joins
CREATE INDEX idx_player_sqid ON player (sqid_id);
CREATE INDEX idx_game_sqid ON game (sqid_id);
CREATE INDEX idx_game_game_type ON game (game_type_id);
CREATE INDEX idx_score_game ON score (game_id);
CREATE INDEX idx_score_player ON score (player_id);
CREATE INDEX idx_rivalry_sqid_type ON rivalry (sqid_id, game_type_id);
CREATE INDEX idx_favorites_sqid_type ON favorites (sqid_id, game_type_id);
-- For time-based queries (analytics, history)
CREATE INDEX idx_score_timestamp ON score (timestamp);
```

---

## Maintenance Job Recommendations

- **Index Maintenance:**
  - Indexes are auto-updated, but for large bulk loads, drop and recreate indexes for speed.
  - Use `DROP INDEX idx_name;` and `CREATE INDEX ...` as needed.
- **Table Optimization:**
  - No need for `VACUUM`; DuckDB handles storage automatically.
  - For heavy delete/insert tables, consider recreating the table to reclaim space.
- **Statistics & Query Planning:**
  - Run `ANALYZE;` after large data changes to update query planner statistics.
- **Backup & Integrity:**
  - Regularly back up the DuckDB database file.
  - Use `PRAGMA database_integrity_check;` to verify database health.
- **Monitoring Index Usage:**
  - Use `EXPLAIN` to check if indexes are used in queries.
  - Query index metadata: `SELECT * FROM duckdb_indexes();`

---

## Example Maintenance SQL

```sql
-- Rebuild an index if needed
DROP INDEX IF EXISTS idx_score_timestamp;
CREATE INDEX idx_score_timestamp ON score (timestamp);
-- Update statistics after bulk load
ANALYZE;
-- Check index metadata
SELECT * FROM duckdb_indexes();
-- Check database integrity
PRAGMA database_integrity_check;
```

---

## Notes

- All objects are scoped to a Sqid for isolation.
- All relationships should be enforced with foreign keys where possible.
- Arrays (e.g., player_ids in Rivalry) should be implemented as join tables for normalization.
- Stats should be recalculated and persisted after each game finalization.
- All timestamps should be stored in UTC for consistency.
