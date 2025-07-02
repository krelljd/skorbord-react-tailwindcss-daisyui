// SQLite database connection for Skorbord
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../skorbord.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    // Log error for maintainability
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite at', dbPath);
  }
});

module.exports = db;
