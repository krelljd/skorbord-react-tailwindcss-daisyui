-- 001_init.sql: Initial seed data for Skorbord (idempotent)
INSERT OR IGNORE INTO players (id, name) VALUES (1, 'Alice'), (2, 'Bob');
INSERT OR IGNORE INTO teams (id, name) VALUES (1, 'Red'), (2, 'Blue');
-- Add more seed data as needed following this pattern
