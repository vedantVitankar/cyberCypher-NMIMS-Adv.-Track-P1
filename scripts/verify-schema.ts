import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');
const db = new Database(DB_PATH);

console.log('Checking user_sessions columns:');
const columns = db.prepare("PRAGMA table_info(user_sessions)").all();
const hasUpdatedAt = columns.some((col: any) => col.name === 'updated_at');

if (hasUpdatedAt) {
  console.log('✅ updated_at column exists in user_sessions table.');
  columns.forEach((col: any) => {
      if (col.name === 'updated_at') console.log(`   - ${col.name} (${col.type})`);
  });
} else {
  console.error('❌ updated_at column MISSING in user_sessions table!');
  process.exit(1);
}
