// ============================================
// RESET ALL USER PASSWORDS - Node.js Script
// ============================================

/**
 * This script sets the password for ALL users to: Test@123
 * Run with: npx tsx scripts/reset-all-passwords.ts
 */

import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');

// Password hashing function (matching auth-service.ts PBKDF2 implementation)
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate salt (16 bytes)
    const saltBytes = crypto.randomBytes(16);
    const saltHex = saltBytes.toString('hex');

    // PBKDF2 with 100,000 iterations, SHA-256, 32 bytes output
    crypto.pbkdf2(password, saltBytes, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      const hashHex = derivedKey.toString('hex');
      resolve(`${saltHex}:${hashHex}`);
    });
  });
}

async function resetAllPasswords() {
  const NEW_PASSWORD = 'Test@123';

  console.log('🔐 Resetting all user passwords...\n');
  console.log(`📁 Database path: ${DB_PATH}\n`);

  // Open database
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  try {
    // Get all users
    const users = db.prepare('SELECT id, email, role FROM users').all() as Array<{
      id: string;
      email: string;
      role: string;
    }>;

    if (users.length === 0) {
      console.log('⚠️  No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} user(s) to update:\n`);

    // Hash the new password
    const passwordHash = await hashPassword(NEW_PASSWORD);

    // Update all users
    const updateStmt = db.prepare(`
      UPDATE users
      SET password_hash = ?,
          status = 'active',
          email_verified = 1,
          email_verified_at = datetime('now'),
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = ?
    `);

    for (const user of users) {
      updateStmt.run(passwordHash, user.id);
      console.log(`✅ ${user.role.toUpperCase().padEnd(10)} ${user.email}`);
    }

    console.log('\n🎉 All passwords have been reset!\n');
    console.log('========================================');
    console.log(`Password for ALL users: ${NEW_PASSWORD}`);
    console.log('========================================');
    console.log('\nAll users are now:');
    console.log('  - Status: active');
    console.log('  - Email verified: yes');
    console.log('  - Failed login attempts: reset to 0');
    console.log('  - Account lock: removed');

  } finally {
    db.close();
  }
}

resetAllPasswords()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
