// API routes for Skorbord
const express = require('express');
const db = require('../db');
const router = express.Router();

// Placeholder Sqid-based access control middleware
function sqidAuth(req, res, next) {
  // TODO: Implement Sqid validation
  next();
}

// Players CRUD
router.get('/players', sqidAuth, (req, res) => {
  db.all('SELECT * FROM players', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/players/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM players WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Player not found' });
    res.json(row);
  });
});

router.post('/players', sqidAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO players (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name });
  });
});

router.put('/players/:id', sqidAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('UPDATE players SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ id: req.params.id, name });
  });
});

router.delete('/players/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM players WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.status(204).end();
  });
});

// Games CRUD
router.get('/games', sqidAuth, (req, res) => {
  db.all('SELECT * FROM games', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/games/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM games WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Game not found' });
    res.json(row);
  });
});

router.post('/games', sqidAuth, (req, res) => {
  const { name, game_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO games (name, game_type) VALUES (?, ?)', [name, game_type || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, game_type });
  });
});

router.put('/games/:id', sqidAuth, (req, res) => {
  const { name, game_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('UPDATE games SET name = ?, game_type = ? WHERE id = ?', [name, game_type || null, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ id: req.params.id, name, game_type });
  });
});

router.delete('/games/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM games WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.status(204).end();
  });
});

// Game Types CRUD
router.get('/game_types', sqidAuth, (req, res) => {
  db.all('SELECT * FROM game_types', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/game_types/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM game_types WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Game type not found' });
    res.json(row);
  });
});

router.post('/game_types', sqidAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO game_types (name, description) VALUES (?, ?)', [name, description || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, description });
  });
});

router.put('/game_types/:id', sqidAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('UPDATE game_types SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game type not found' });
    res.json({ id: req.params.id, name, description });
  });
});

router.delete('/game_types/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM game_types WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Game type not found' });
    res.status(204).end();
  });
});

// Rivalries CRUD
router.get('/rivalries', sqidAuth, (req, res) => {
  db.all('SELECT * FROM rivalries', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/rivalries/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM rivalries WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Rivalry not found' });
    res.json(row);
  });
});

router.post('/rivalries', sqidAuth, (req, res) => {
  const { team1_id, team2_id } = req.body;
  if (!team1_id || !team2_id) return res.status(400).json({ error: 'Both team1_id and team2_id are required' });
  db.run('INSERT INTO rivalries (team1_id, team2_id) VALUES (?, ?)', [team1_id, team2_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, team1_id, team2_id });
  });
});

router.put('/rivalries/:id', sqidAuth, (req, res) => {
  const { team1_id, team2_id } = req.body;
  if (!team1_id || !team2_id) return res.status(400).json({ error: 'Both team1_id and team2_id are required' });
  db.run('UPDATE rivalries SET team1_id = ?, team2_id = ? WHERE id = ?', [team1_id, team2_id, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Rivalry not found' });
    res.json({ id: req.params.id, team1_id, team2_id });
  });
});

router.delete('/rivalries/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM rivalries WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Rivalry not found' });
    res.status(204).end();
  });
});

// Stats CRUD
router.get('/stats', sqidAuth, (req, res) => {
  db.all('SELECT * FROM stats', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/stats/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM stats WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Stat not found' });
    res.json(row);
  });
});

router.post('/stats', sqidAuth, (req, res) => {
  const { player_id, game_id, score } = req.body;
  if (!player_id || !game_id) return res.status(400).json({ error: 'player_id and game_id are required' });
  db.run('INSERT INTO stats (player_id, game_id, score) VALUES (?, ?, ?)', [player_id, game_id, score || 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, player_id, game_id, score: score || 0 });
  });
});

router.put('/stats/:id', sqidAuth, (req, res) => {
  const { player_id, game_id, score } = req.body;
  if (!player_id || !game_id) return res.status(400).json({ error: 'player_id and game_id are required' });
  db.run('UPDATE stats SET player_id = ?, game_id = ?, score = ? WHERE id = ?', [player_id, game_id, score || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Stat not found' });
    res.json({ id: req.params.id, player_id, game_id, score: score || 0 });
  });
});

router.delete('/stats/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM stats WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Stat not found' });
    res.status(204).end();
  });
});

// Sqids CRUD
router.get('/sqids', sqidAuth, (req, res) => {
  db.all('SELECT * FROM sqids', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/sqids/:id', sqidAuth, (req, res) => {
  db.get('SELECT * FROM sqids WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Sqid not found' });
    res.json(row);
  });
});

router.post('/sqids', sqidAuth, (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'Value is required' });
  db.run('INSERT INTO sqids (value) VALUES (?)', [value], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, value });
  });
});

router.put('/sqids/:id', sqidAuth, (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'Value is required' });
  db.run('UPDATE sqids SET value = ? WHERE id = ?', [value, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Sqid not found' });
    res.json({ id: req.params.id, value });
  });
});

router.delete('/sqids/:id', sqidAuth, (req, res) => {
  db.run('DELETE FROM sqids WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Sqid not found' });
    res.status(204).end();
  });
});

// Example endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Skorbord API root' });
});

module.exports = router;
