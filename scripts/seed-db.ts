// ============================================
// DATABASE SEED SCRIPT
// Run with: npx tsx scripts/seed-db.ts
// ============================================

import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');

console.log('🌱 Seeding database...');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Helper to generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to hash password (PBKDF2)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const saltHex = salt.toString('hex');

  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const hashHex = derivedKey.toString('hex');

  return `${saltHex}:${hashHex}`;
}

async function seed() {
  const now = new Date().toISOString();

  // ============================================
  // SEED PERMISSIONS
  // ============================================
  console.log('   Seeding permissions...');

  const permissions = [
    // Product permissions
    { name: 'products:read', description: 'View products', resource: 'products', action: 'read' },
    { name: 'products:create', description: 'Create products', resource: 'products', action: 'create' },
    { name: 'products:update', description: 'Update products', resource: 'products', action: 'update' },
    { name: 'products:delete', description: 'Delete products', resource: 'products', action: 'delete' },
    { name: 'products:manage', description: 'Full product management', resource: 'products', action: 'manage' },
    // Order permissions
    { name: 'orders:read', description: 'View orders', resource: 'orders', action: 'read' },
    { name: 'orders:create', description: 'Create orders', resource: 'orders', action: 'create' },
    { name: 'orders:update', description: 'Update orders', resource: 'orders', action: 'update' },
    { name: 'orders:cancel', description: 'Cancel orders', resource: 'orders', action: 'cancel' },
    { name: 'orders:refund', description: 'Process refunds', resource: 'orders', action: 'refund' },
    { name: 'orders:manage', description: 'Full order management', resource: 'orders', action: 'manage' },
    // User permissions
    { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
    { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
    { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
    { name: 'users:manage', description: 'Full user management', resource: 'users', action: 'manage' },
    // Ticket permissions
    { name: 'tickets:read', description: 'View support tickets', resource: 'tickets', action: 'read' },
    { name: 'tickets:create', description: 'Create support tickets', resource: 'tickets', action: 'create' },
    { name: 'tickets:respond', description: 'Respond to tickets', resource: 'tickets', action: 'respond' },
    { name: 'tickets:close', description: 'Close tickets', resource: 'tickets', action: 'close' },
    { name: 'tickets:manage', description: 'Full ticket management', resource: 'tickets', action: 'manage' },
    // Merchant permissions
    { name: 'merchants:read', description: 'View merchants', resource: 'merchants', action: 'read' },
    { name: 'merchants:verify', description: 'Verify merchants', resource: 'merchants', action: 'verify' },
    { name: 'merchants:suspend', description: 'Suspend merchants', resource: 'merchants', action: 'suspend' },
    { name: 'merchants:manage', description: 'Full merchant management', resource: 'merchants', action: 'manage' },
    // Agent permissions
    { name: 'agent:view', description: 'View agent dashboard', resource: 'agent', action: 'view' },
    { name: 'agent:run', description: 'Run agent manually', resource: 'agent', action: 'run' },
    { name: 'agent:approve', description: 'Approve agent actions', resource: 'agent', action: 'approve' },
    { name: 'agent:configure', description: 'Configure agent settings', resource: 'agent', action: 'configure' },
    // Admin permissions
    { name: 'admin:access', description: 'Access admin panel', resource: 'admin', action: 'access' },
    { name: 'admin:settings', description: 'Manage system settings', resource: 'admin', action: 'settings' },
    { name: 'admin:logs', description: 'View audit logs', resource: 'admin', action: 'logs' },
    { name: 'admin:billing', description: 'Access billing', resource: 'admin', action: 'billing' },
  ];

  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO permissions (id, name, description, resource, action, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const permissionIds: Record<string, string> = {};
  for (const perm of permissions) {
    const id = uuid();
    insertPermission.run(id, perm.name, perm.description, perm.resource, perm.action, now);
    permissionIds[perm.name] = id;
  }

  // Get existing permission IDs
  const existingPerms = db.prepare('SELECT id, name FROM permissions').all() as { id: string; name: string }[];
  for (const perm of existingPerms) {
    permissionIds[perm.name] = perm.id;
  }

  console.log(`   Created ${permissions.length} permissions`);

  // ============================================
  // SEED ROLE PERMISSIONS
  // ============================================
  console.log('   Seeding role permissions...');

  const rolePermissions: Record<string, string[]> = {
    customer: [
      'products:read', 'orders:read', 'orders:create', 'orders:cancel',
      'tickets:create', 'tickets:read'
    ],
    merchant: [
      'products:read', 'products:create', 'products:update', 'products:delete',
      'orders:read', 'orders:update', 'orders:refund',
      'tickets:create', 'tickets:read'
    ],
    support: [
      'products:read', 'orders:read', 'orders:update', 'orders:cancel', 'orders:refund',
      'users:read', 'tickets:read', 'tickets:respond', 'tickets:close', 'tickets:manage',
      'merchants:read', 'agent:view', 'agent:approve'
    ],
    admin: Object.keys(permissionIds) // All permissions
  };

  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (id, role, permission_id, created_at)
    VALUES (?, ?, ?, ?)
  `);

  let rolePermCount = 0;
  for (const [role, perms] of Object.entries(rolePermissions)) {
    for (const permName of perms) {
      const permId = permissionIds[permName];
      if (permId) {
        insertRolePermission.run(uuid(), role, permId, now);
        rolePermCount++;
      }
    }
  }

  console.log(`   Created ${rolePermCount} role-permission mappings`);

  // ============================================
  // SEED TEST USERS
  // ============================================
  console.log('   Seeding test users...');

  const testPassword = await hashPassword('Test@123');

  const users = [
    { email: 'customer@test.com', full_name: 'Test Customer', role: 'customer' },
    { email: 'merchant@test.com', full_name: 'Test Merchant', role: 'merchant' },
    { email: 'support@test.com', full_name: 'Test Support', role: 'support' },
    { email: 'admin@test.com', full_name: 'Test Admin', role: 'admin' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, status, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?)
  `);

  const insertCustomerProfile = db.prepare(`
    INSERT OR IGNORE INTO customer_profiles (id, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertMerchantProfile = db.prepare(`
    INSERT OR IGNORE INTO merchant_profiles (id, user_id, merchant_id, business_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMerchant = db.prepare(`
    INSERT OR IGNORE INTO merchants (id, user_id, store_name, store_slug, email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `);

  const insertSupportProfile = db.prepare(`
    INSERT OR IGNORE INTO support_profiles (id, user_id, employee_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAdminProfile = db.prepare(`
    INSERT OR IGNORE INTO admin_profiles (id, user_id, admin_level, can_manage_admins, can_manage_permissions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let testMerchantId = '';

  for (const user of users) {
    const userId = uuid();
    insertUser.run(userId, user.email, testPassword, user.full_name, user.role, now, now);

    // Create role-specific profile
    switch (user.role) {
      case 'customer':
        insertCustomerProfile.run(uuid(), userId, now, now);
        break;
      case 'merchant':
        const merchantId = uuid();
        testMerchantId = merchantId;
        insertMerchant.run(merchantId, userId, 'Test Merchant Store', 'test-store', user.email, now, now);
        insertMerchantProfile.run(uuid(), userId, merchantId, 'Test Merchant Store', now, now);
        break;
      case 'support':
        insertSupportProfile.run(uuid(), userId, 'SUP-001', now, now);
        break;
      case 'admin':
        insertAdminProfile.run(uuid(), userId, 3, 1, 1, now, now);
        break;
    }
  }

  console.log(`   Created ${users.length} test users`);

  // ============================================
  // SEED CATEGORIES
  // ============================================
  console.log('   Seeding categories...');

  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Cutting-edge tech gadgets and devices' },
    { name: 'Wearables', slug: 'wearables', description: 'Smart watches, fitness trackers, and more' },
    { name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and audio equipment' },
    { name: 'Accessories', slug: 'accessories', description: 'Phone cases, chargers, and tech accessories' },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles, controllers, and accessories' },
    { name: 'Home Tech', slug: 'home-tech', description: 'Smart home devices and automation' },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, slug, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const id = uuid();
    insertCategory.run(id, cat.name, cat.slug, cat.description, now);
    categoryIds[cat.slug] = id;
  }

  // Get existing category IDs
  const existingCats = db.prepare('SELECT id, slug FROM categories').all() as { id: string; slug: string }[];
  for (const cat of existingCats) {
    categoryIds[cat.slug] = cat.id;
  }

  console.log(`   Created ${categories.length} categories`);

  // ============================================
  // SEED PRODUCTS
  // ============================================
  console.log('   Seeding products...');

  const products = [
    {
      name: 'Quantum Pro Headphones',
      slug: 'quantum-pro-headphones',
      description: 'Premium wireless headphones with active noise cancellation and spatial audio.',
      price: 299.99,
      compare_at_price: 349.99,
      category: 'audio',
      brand: 'SoundWave',
      stock_quantity: 50,
      rating: 4.8,
      review_count: 256,
      is_featured: 1,
      is_new: 0,
      discount_percentage: 14,
    },
    {
      name: 'Nova Smart Watch X',
      slug: 'nova-smart-watch-x',
      description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
      price: 449.99,
      compare_at_price: null,
      category: 'wearables',
      brand: 'TechNova',
      stock_quantity: 30,
      rating: 4.6,
      review_count: 189,
      is_featured: 1,
      is_new: 1,
      discount_percentage: 0,
    },
    {
      name: 'Stellar Wireless Earbuds',
      slug: 'stellar-wireless-earbuds',
      description: 'Compact earbuds with crystal-clear audio and 30-hour total battery life.',
      price: 149.99,
      compare_at_price: 179.99,
      category: 'audio',
      brand: 'SoundWave',
      stock_quantity: 100,
      rating: 4.5,
      review_count: 423,
      is_featured: 0,
      is_new: 0,
      discount_percentage: 17,
    },
    {
      name: 'Nebula Gaming Controller',
      slug: 'nebula-gaming-controller',
      description: 'Professional gaming controller with customizable buttons and haptic feedback.',
      price: 79.99,
      compare_at_price: null,
      category: 'gaming',
      brand: 'GameForce',
      stock_quantity: 75,
      rating: 4.7,
      review_count: 312,
      is_featured: 1,
      is_new: 0,
      discount_percentage: 0,
    },
    {
      name: 'Cosmos Smart Speaker',
      slug: 'cosmos-smart-speaker',
      description: 'Voice-controlled smart speaker with 360° sound and smart home integration.',
      price: 199.99,
      compare_at_price: 249.99,
      category: 'home-tech',
      brand: 'SmartLife',
      stock_quantity: 40,
      rating: 4.4,
      review_count: 156,
      is_featured: 0,
      is_new: 1,
      discount_percentage: 20,
    },
    {
      name: 'Orbit Phone Case Pro',
      slug: 'orbit-phone-case-pro',
      description: 'Military-grade protection case with built-in stand and wireless charging support.',
      price: 49.99,
      compare_at_price: null,
      category: 'accessories',
      brand: 'TechArmor',
      stock_quantity: 200,
      rating: 4.3,
      review_count: 89,
      is_featured: 0,
      is_new: 0,
      discount_percentage: 0,
    },
  ];

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (
      id, name, slug, description, price, compare_at_price, category_id, merchant_id, brand,
      stock_quantity, rating, review_count, images, is_featured, is_new,
      discount_percentage, specifications, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    const categoryId = categoryIds[product.category];
    const images = JSON.stringify([
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800'
    ]);
    const specs = JSON.stringify({
      weight: '250g',
      dimensions: '10 x 8 x 4 cm',
      warranty: '2 years'
    });

    insertProduct.run(
      uuid(),
      product.name,
      product.slug,
      product.description,
      product.price,
      product.compare_at_price,
      categoryId,
      testMerchantId,
      product.brand,
      product.stock_quantity,
      product.rating,
      product.review_count,
      images,
      product.is_featured,
      product.is_new,
      product.discount_percentage,
      specs,
      now,
      now
    );
  }

  console.log(`   Created ${products.length} products`);

  db.close();

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Test accounts (password: Test123!@#):');
  console.log('   - customer@test.com');
  console.log('   - merchant@test.com');
  console.log('   - support@test.com');
  console.log('   - admin@test.com');
}

seed().catch(console.error);
