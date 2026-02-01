// ============================================
// DATABASE CONNECTION & INITIALIZATION
// ============================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection singleton
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');
    // Enable WAL mode for better performance
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}

// Initialize database with schema
export function initializeDatabase(): void {
  const db = getDatabase();

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');

  // For production builds, schema might be in different location
  let schemaSQL: string;
  if (fs.existsSync(schemaPath)) {
    schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
  } else {
    // Fallback to reading from src directory during development
    const devSchemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    schemaSQL = fs.readFileSync(devSchemaPath, 'utf-8');
  }

  // Execute schema (split by semicolons and execute each statement)
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error) {
      // Ignore errors for CREATE TABLE IF NOT EXISTS
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        console.error('Schema execution error:', statement.substring(0, 100), error);
      }
    }
  }
}

// Close database connection
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Export the database getter
export const db = {
  get instance() {
    return getDatabase();
  }
};

// Auto-initialize on first import
try {
  initializeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
}
