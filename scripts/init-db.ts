// ============================================
// DATABASE INITIALIZATION SCRIPT
// Run with: npx tsx scripts/init-db.ts
// ============================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');

console.log('🚀 Initializing database...');
console.log(`   Path: ${DB_PATH}`);

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('   Created data directory');
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Read and execute schema
const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

// Execute the entire schema as a single transaction
try {
  db.exec(schemaSQL);
  console.log('   Schema executed successfully');
} catch (error) {
  console.error('   Schema execution error:', error);

  // Fallback: try executing statements one by one
  const statements = schemaSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      db.exec(statement);
      successCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('already exists')) {
        console.error(`   Error: ${statement.substring(0, 60)}...`);
        console.error(`   ${message}`);
        errorCount++;
      }
    }
  }

  console.log(`   Executed ${successCount} statements with ${errorCount} errors`);
}

// Verify tables were created
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`   Created ${tables.length} tables`);

db.close();

console.log('✅ Database initialized successfully!');
console.log('   Run "npm run db:seed" to add seed data');
