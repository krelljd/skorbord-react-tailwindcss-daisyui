// Seed runner for Skorbord API (idempotent)
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

const seedsDir = path.join(__dirname, '../seeds');

function runSeeds() {
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql'));
  files.sort();
  db.serialize(() => {
    files.forEach(file => {
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      db.exec(sql, err => {
        if (err) {
          console.error(`Seed failed (${file}):`, err.message);
        } else {
          console.log(`Seed applied: ${file}`);
        }
      });
    });
  });
}

runSeeds();
