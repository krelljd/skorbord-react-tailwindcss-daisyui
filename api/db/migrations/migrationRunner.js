import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Migration runner for SQLite database
 */
export class MigrationRunner {
  constructor(db) {
    this.db = db;
  }

  async createMigrationTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.db.run(sql);
  }

  async getAppliedMigrations() {
    try {
      const result = await this.db.query('SELECT name FROM migrations ORDER BY name');
      return result.map(row => row.name);
    } catch (error) {
      // If table doesn't exist, return empty array
      return [];
    }
  }

  async markMigrationAsApplied(migrationName) {
    await this.db.run('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
  }

  async getMigrationFiles() {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  async runMigration(filename) {
    const filePath = join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔄 Running migration: ${filename}`);
    
    // Split SQL on semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await this.db.run(statement.trim());
      }
    }
    
    await this.markMigrationAsApplied(filename);
    console.log(`✅ Migration completed: ${filename}`);
  }

  async run() {
    console.log('🔄 Starting database migrations...');
    // Create migrations table if it doesn't exist
    await this.createMigrationTable();
    // Get applied and pending migrations
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    console.log('🗂 Migration files found:', migrationFiles);
    console.log('📝 Applied migrations:', appliedMigrations);
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    console.log('🕒 Pending migrations:', pendingMigrations);
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    console.log(`🔄 Found ${pendingMigrations.length} pending migrations`);
    // Run pending migrations
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    console.log('✅ All migrations completed successfully');
  }
}


export async function runMigrations(db) {
  const runner = new MigrationRunner(db);
  await runner.run();
}

// Add top-level script runner for CLI usage

// ES module entry point check
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 migrationRunner.js starting...');
  import('../database.js').then(async ({ default: db }) => {
    try {
      await runMigrations(db);
      console.log('🏁 migrationRunner.js finished.');
      process.exit(0);
    } catch (err) {
      console.error('❌ migrationRunner.js error:', err);
      process.exit(1);
    }
  });
}
