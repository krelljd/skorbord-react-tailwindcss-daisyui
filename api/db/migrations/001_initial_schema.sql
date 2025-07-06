-- +migrate Up
-- Create sqids table
CREATE TABLE sqids (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id TEXT
);

-- Create game_types table
CREATE TABLE game_types (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    win_condition INTEGER,
    loss_condition INTEGER,
    is_win_condition BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    sqid_id TEXT NOT NULL REFERENCES sqids(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sqid_id, name)
);

-- Create games table
CREATE TABLE games (
    id TEXT PRIMARY KEY,
    sqid_id TEXT NOT NULL REFERENCES sqids(id) ON DELETE CASCADE,
    game_type_id TEXT NOT NULL REFERENCES game_types(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    winner_id TEXT REFERENCES players(id),
    finalized BOOLEAN DEFAULT false
);

-- Create stats table (stores individual scores)
CREATE TABLE stats (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= -999 AND score <= 999),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rivalries table
CREATE TABLE rivalries (
    id TEXT PRIMARY KEY,
    sqid_id TEXT NOT NULL REFERENCES sqids(id) ON DELETE CASCADE,
    game_type_id TEXT NOT NULL REFERENCES game_types(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sqid_id, game_type_id)
);

-- Create rivalry_players table (many-to-many between rivalries and players)
CREATE TABLE rivalry_players (
    rivalry_id TEXT NOT NULL REFERENCES rivalries(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    PRIMARY KEY (rivalry_id, player_id)
);

-- Create rivalry_stats table (aggregated statistics for rivalries)
CREATE TABLE rivalry_stats (
    id TEXT PRIMARY KEY,
    rivalry_id TEXT NOT NULL REFERENCES rivalries(id) ON DELETE CASCADE,
    avg_margin REAL,
    last_10_results TEXT, -- Store as string like "WWLWLLWWLW"
    min_win_margin INTEGER,
    max_win_margin INTEGER,
    min_loss_margin INTEGER,
    max_loss_margin INTEGER,
    total_games INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create favorites table (favorited game types per sqid)
CREATE TABLE favorites (
    sqid_id TEXT NOT NULL REFERENCES sqids(id) ON DELETE CASCADE,
    game_type_id TEXT NOT NULL REFERENCES game_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sqid_id, game_type_id)
);

-- Create indexes for performance
CREATE INDEX idx_players_sqid ON players (sqid_id);
CREATE INDEX idx_games_sqid ON games (sqid_id);
CREATE INDEX idx_games_game_type ON games (game_type_id);
CREATE INDEX idx_stats_game ON stats (game_id);
CREATE INDEX idx_stats_player ON stats (player_id);
CREATE INDEX idx_rivalries_sqid_type ON rivalries (sqid_id, game_type_id);
CREATE INDEX idx_favorites_sqid_type ON favorites (sqid_id, game_type_id);
CREATE INDEX idx_stats_timestamp ON stats (created_at);

-- Insert default game types
INSERT INTO game_types (id, name, description, win_condition, is_win_condition) VALUES
    ('hearts', 'Hearts', 'Traditional Hearts card game', 100, false),
    ('spades', 'Spades', 'Traditional Spades card game', 500, true),
    ('euchre', 'Euchre', 'Traditional Euchre card game', 10, true),
    ('poker', 'Poker', 'Poker chip game', 0, true),
    ('custom', 'Custom', 'Custom scoring game', 100, true);

-- +migrate Down
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS rivalry_stats;
DROP TABLE IF EXISTS rivalry_players;
DROP TABLE IF EXISTS rivalries;
DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS game_types;
DROP TABLE IF EXISTS sqids;
