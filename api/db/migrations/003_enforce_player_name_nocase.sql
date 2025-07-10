-- +migrate Up
-- Enforce case-insensitive uniqueness for player names within a sqid
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_sqid_name_nocase ON players (sqid_id, TRIM(name) COLLATE NOCASE);

-- +migrate Down
DROP INDEX IF EXISTS idx_players_sqid_name_nocase;
