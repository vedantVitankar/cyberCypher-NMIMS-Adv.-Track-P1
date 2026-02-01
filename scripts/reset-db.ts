import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');

console.log('🗑️  Deleting database...');
if (fs.existsSync(DB_PATH)) {
  try {
    fs.unlinkSync(DB_PATH);
    console.log('   Database deleted.');
  } catch (error) {
    console.error('   Failed to delete database file:', error);
    process.exit(1);
  }
} else {
  console.log('   Database does not exist, skipping deletion.');
}

try {
  console.log('\n🚀 Running db:init...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} run db:init`, { stdio: 'inherit' });

  console.log('\n🌱 Running db:seed...');
  execSync(`${npmCmd} run db:seed`, { stdio: 'inherit' });
  
  console.log('\n✅ Database reset complete!');
} catch (error) {
  console.error('\n❌ Database reset failed.');
  process.exit(1);
}
