// Migration runner for Skorbord API (idempotent)
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

const migrationsDir = path.join(__dirname, '../migrations');

function runMigrations() {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  files.sort();
  db.serialize(() => {
    files.forEach(file => {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql, err => {
        if (err) {
          console.error(`Migration failed (${file}):`, err.message);
        } else {
          console.log(`Migration applied: ${file}`);
        }
      });
    });
  });
}

runMigrations();
