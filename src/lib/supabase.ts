// ============================================
// DATABASE CLIENT (SQLite via better-sqlite3)
// Provides Supabase-compatible API
// ============================================

export { supabase } from './db/query-builder';
export { getDatabase, initializeDatabase, closeDatabase } from './db/index';
export { generateUUID, now, parseJSON, toJSON } from './db/utils';
