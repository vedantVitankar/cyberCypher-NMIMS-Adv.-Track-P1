import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');
const db = new Database(DB_PATH);

console.log('Verifying Database State...');

// Check products table schema
const productCols = db.prepare("PRAGMA table_info(products)").all() as any[];
const hasMerchantId = productCols.some(c => c.name === 'merchant_id');
console.log(`- products.merchant_id column: ${hasMerchantId ? '✅ Found' : '❌ Missing'}`);

// Check merchants table content
const merchants = db.prepare("SELECT * FROM merchants").all() as any[];
console.log(`- merchants count: ${merchants.length}`);
if (merchants.length > 0) {
  console.log(`  - First merchant: ${merchants[0].store_name} (${merchants[0].email})`);
} else {
  console.log('  ❌ No merchants found!');
}

// Check products content
const products = db.prepare("SELECT id, name, merchant_id FROM products LIMIT 5").all() as any[];
console.log(`- products count: ${products.length} (sample)`);
const productsWithMerchant = products.filter(p => p.merchant_id);
console.log(`  - Products with merchant_id: ${productsWithMerchant.length}/${products.length}`);

if (productsWithMerchant.length > 0) {
  console.log('✅ Products are correctly linked to merchants.');
} else {
  console.log('❌ Products are NOT linked to merchants.');
}
