import db from './db/database.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize database connection
    await db.initialize();
    
    // Read and execute migration SQL
    const migrationPath = join(__dirname, 'db/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comment lines and get the main SQL content
    const lines = migrationSQL.split('\n');
    const sqlLines = lines.filter(line => 
      !line.trim().startsWith('--') && 
      line.trim() !== '' &&
      line.trim() !== '-- +migrate Up' &&
      line.trim() !== '-- +migrate Down'
    );
    
    const cleanSQL = sqlLines.join('\n');
    
    // Split by semicolons but be smarter about it
    const statements = [];
    let currentStatement = '';
    let inCreateTable = false;
    
    for (const line of sqlLines) {
      if (line.trim().toUpperCase().startsWith('CREATE TABLE')) {
        inCreateTable = true;
      }
      
      currentStatement += line + '\n';
      
      if (line.trim().endsWith(');') && (inCreateTable || !line.includes('('))) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inCreateTable = false;
      } else if (line.trim().endsWith(';') && !inCreateTable) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log('Total statements found:', statements.length);
    
    // Separate different types of statements
    const createTableStatements = statements.filter(stmt => stmt.toUpperCase().includes('CREATE TABLE'));
    const createIndexStatements = statements.filter(stmt => stmt.toUpperCase().includes('CREATE INDEX'));
    const insertStatements = statements.filter(stmt => stmt.toUpperCase().includes('INSERT INTO'));
    
    console.log(`Found ${createTableStatements.length} CREATE TABLE statements`);
    console.log(`Found ${createIndexStatements.length} CREATE INDEX statements`);
    console.log(`Found ${insertStatements.length} INSERT statements`);
    
    // Execute in proper order: CREATE TABLE first, then CREATE INDEX, then INSERT
    const orderedStatements = [...createTableStatements, ...createIndexStatements, ...insertStatements];
    
    console.log('Executing migration statements...');
    for (const statement of orderedStatements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50).replace(/\s+/g, ' ') + '...');
        await db.run(statement);
      }
    }
    
    console.log('✅ Database initialized successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
