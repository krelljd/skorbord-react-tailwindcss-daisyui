// Socket.IO logic for Skorbord API
// Modularize all real-time event handlers here
const db = require('../db');

module.exports = function(io) {
  io.on('connection', (socket) => {
    // Example: emit a welcome event
    socket.emit('welcome', { message: 'Connected to Skorbord API' });

    // Example: handle a ping event
    socket.on('ping', (data, ack) => {
      if (ack) ack({ pong: true });
    });

    // Real-time: create player
    socket.on('player:create', (data, ack) => {
      if (!data || !data.name) return ack && ack({ error: 'Name is required' });
      db.run('INSERT INTO players (name) VALUES (?)', [data.name], function(err) {
        if (err) return ack && ack({ error: err.message });
        const player = { id: this.lastID, name: data.name };
        io.emit('player:created', player);
        ack && ack(player);
      });
    });

    // Real-time: update player
    socket.on('player:update', (data, ack) => {
      if (!data || !data.id || !data.name) return ack && ack({ error: 'ID and name required' });
      db.run('UPDATE players SET name = ? WHERE id = ?', [data.name, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Player not found' });
        const player = { id: data.id, name: data.name };
        io.emit('player:updated', player);
        ack && ack(player);
      });
    });

    // Real-time: delete player
    socket.on('player:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM players WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Player not found' });
        io.emit('player:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Real-time: create game
    socket.on('game:create', (data, ack) => {
      if (!data || !data.name) return ack && ack({ error: 'Name is required' });
      db.run('INSERT INTO games (name, game_type) VALUES (?, ?)', [data.name, data.game_type || null], function(err) {
        if (err) return ack && ack({ error: err.message });
        const game = { id: this.lastID, name: data.name, game_type: data.game_type || null };
        io.emit('game:created', game);
        ack && ack(game);
      });
    });

    // Real-time: update game
    socket.on('game:update', (data, ack) => {
      if (!data || !data.id || !data.name) return ack && ack({ error: 'ID and name required' });
      db.run('UPDATE games SET name = ?, game_type = ? WHERE id = ?', [data.name, data.game_type || null, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Game not found' });
        const game = { id: data.id, name: data.name, game_type: data.game_type || null };
        io.emit('game:updated', game);
        ack && ack(game);
      });
    });

    // Real-time: delete game
    socket.on('game:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM games WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Game not found' });
        io.emit('game:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Real-time: create game_type
    socket.on('game_type:create', (data, ack) => {
      if (!data || !data.name) return ack && ack({ error: 'Name is required' });
      db.run('INSERT INTO game_types (name, description) VALUES (?, ?)', [data.name, data.description || null], function(err) {
        if (err) return ack && ack({ error: err.message });
        const gameType = { id: this.lastID, name: data.name, description: data.description || null };
        io.emit('game_type:created', gameType);
        ack && ack(gameType);
      });
    });
    socket.on('game_type:update', (data, ack) => {
      if (!data || !data.id || !data.name) return ack && ack({ error: 'ID and name required' });
      db.run('UPDATE game_types SET name = ?, description = ? WHERE id = ?', [data.name, data.description || null, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Game type not found' });
        const gameType = { id: data.id, name: data.name, description: data.description || null };
        io.emit('game_type:updated', gameType);
        ack && ack(gameType);
      });
    });
    socket.on('game_type:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM game_types WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Game type not found' });
        io.emit('game_type:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Real-time: create rivalry
    socket.on('rivalry:create', (data, ack) => {
      if (!data || !data.team1_id || !data.team2_id) return ack && ack({ error: 'team1_id and team2_id required' });
      db.run('INSERT INTO rivalries (team1_id, team2_id) VALUES (?, ?)', [data.team1_id, data.team2_id], function(err) {
        if (err) return ack && ack({ error: err.message });
        const rivalry = { id: this.lastID, team1_id: data.team1_id, team2_id: data.team2_id };
        io.emit('rivalry:created', rivalry);
        ack && ack(rivalry);
      });
    });
    socket.on('rivalry:update', (data, ack) => {
      if (!data || !data.id || !data.team1_id || !data.team2_id) return ack && ack({ error: 'ID, team1_id, and team2_id required' });
      db.run('UPDATE rivalries SET team1_id = ?, team2_id = ? WHERE id = ?', [data.team1_id, data.team2_id, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Rivalry not found' });
        const rivalry = { id: data.id, team1_id: data.team1_id, team2_id: data.team2_id };
        io.emit('rivalry:updated', rivalry);
        ack && ack(rivalry);
      });
    });
    socket.on('rivalry:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM rivalries WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Rivalry not found' });
        io.emit('rivalry:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Real-time: create stat
    socket.on('stat:create', (data, ack) => {
      if (!data || !data.player_id || !data.game_id) return ack && ack({ error: 'player_id and game_id required' });
      db.run('INSERT INTO stats (player_id, game_id, score) VALUES (?, ?, ?)', [data.player_id, data.game_id, data.score || 0], function(err) {
        if (err) return ack && ack({ error: err.message });
        const stat = { id: this.lastID, player_id: data.player_id, game_id: data.game_id, score: data.score || 0 };
        io.emit('stat:created', stat);
        ack && ack(stat);
      });
    });
    socket.on('stat:update', (data, ack) => {
      if (!data || !data.id || !data.player_id || !data.game_id) return ack && ack({ error: 'ID, player_id, and game_id required' });
      db.run('UPDATE stats SET player_id = ?, game_id = ?, score = ? WHERE id = ?', [data.player_id, data.game_id, data.score || 0, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Stat not found' });
        const stat = { id: data.id, player_id: data.player_id, game_id: data.game_id, score: data.score || 0 };
        io.emit('stat:updated', stat);
        ack && ack(stat);
      });
    });
    socket.on('stat:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM stats WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Stat not found' });
        io.emit('stat:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Real-time: create sqid
    socket.on('sqid:create', (data, ack) => {
      if (!data || !data.value) return ack && ack({ error: 'Value is required' });
      db.run('INSERT INTO sqids (value) VALUES (?)', [data.value], function(err) {
        if (err) return ack && ack({ error: err.message });
        const sqid = { id: this.lastID, value: data.value };
        io.emit('sqid:created', sqid);
        ack && ack(sqid);
      });
    });
    socket.on('sqid:update', (data, ack) => {
      if (!data || !data.id || !data.value) return ack && ack({ error: 'ID and value required' });
      db.run('UPDATE sqids SET value = ? WHERE id = ?', [data.value, data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Sqid not found' });
        const sqid = { id: data.id, value: data.value };
        io.emit('sqid:updated', sqid);
        ack && ack(sqid);
      });
    });
    socket.on('sqid:delete', (data, ack) => {
      if (!data || !data.id) return ack && ack({ error: 'ID required' });
      db.run('DELETE FROM sqids WHERE id = ?', [data.id], function(err) {
        if (err) return ack && ack({ error: err.message });
        if (this.changes === 0) return ack && ack({ error: 'Sqid not found' });
        io.emit('sqid:deleted', { id: data.id });
        ack && ack({ id: data.id });
      });
    });

    // Add more event handlers and namespaces as needed
  });
};
