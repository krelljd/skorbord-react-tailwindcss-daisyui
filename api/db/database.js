import Database from 'duckdb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = null;
    this.connection = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.connection;
    }

    try {
      // Parse database URL
      const dbUrl = process.env.DATABASE_URL || 'duckdb:///db/cards-duckdb.db';
      let dbPath = dbUrl.replace('duckdb://', '');
      
      // Handle relative paths
      if (!dbPath.startsWith('/')) {
        dbPath = join(__dirname, '..', dbPath);
      }

      // Ensure directory exists
      const dbDir = dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize DuckDB
      this.db = new Database.Database(dbPath);
      this.connection = this.db.connect();

      this.isInitialized = true;
      console.log(`📊 Database initialized: ${dbPath}`);
      
      return this.connection;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.connection.all(sql, ...params, (err, result) => {
        if (err) {
          console.error('❌ Database query error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async run(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.connection.run(sql, ...params, function(err) {
        if (err) {
          console.error('❌ Database run error:', err);
          reject(err);
        } else {
          resolve({ changes: this.changes, lastID: this.lastID });
        }
      });
    });
  }

  async get(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.connection.get(sql, ...params, (err, row) => {
        if (err) {
          console.error('❌ Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async close() {
    if (this.connection) {
      this.connection.close();
    }
    if (this.db) {
      this.db.close();
    }
    this.isInitialized = false;
  }

  // Transaction support
  async transaction(callback) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.run('BEGIN TRANSACTION');
      const result = await callback(this);
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.length > 0 && result[0].health === 1;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const db = new DatabaseManager();

export default db;
