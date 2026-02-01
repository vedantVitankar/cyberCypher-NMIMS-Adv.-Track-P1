// ============================================
// CREATE TEST USERS - Node.js Script
// ============================================

/**
 * This script creates test users for each role with password: *@123
 * Run with: npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('\nPlease set the following in your .env file:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nSee the Supabase setup guide in the README for instructions.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Password hashing functions (matching auth-service.ts)
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate salt
    const saltBytes = crypto.randomBytes(16);
    const saltHex = saltBytes.toString('hex');

    // PBKDF2 with 100,000 iterations
    crypto.pbkdf2(password, saltBytes, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      const hashHex = derivedKey.toString('hex');
      resolve(`${saltHex}:${hashHex}`);
    });
  });
}

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  const password = '*@123';
  const passwordHash = await hashPassword(password);

  const users = [
    {
      email: 'customer@test.com',
      full_name: 'Test Customer',
      role: 'customer',
      profileTable: 'customer_profiles',
      profileData: {},
    },
    {
      email: 'merchant@test.com',
      full_name: 'Test Merchant',
      role: 'merchant',
      profileTable: 'merchant_profiles',
      profileData: {
        business_name: 'Test Merchant Store',
        business_email: 'merchant@test.com',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      },
    },
    {
      email: 'support@test.com',
      full_name: 'Test Support Agent',
      role: 'support',
      profileTable: 'support_profiles',
      profileData: {
        employee_id: 'SUP-001',
        department: 'general',
        specializations: ['migration', 'api', 'checkout'],
        is_available: true,
      },
    },
    {
      email: 'admin@test.com',
      full_name: 'Test Admin',
      role: 'admin',
      profileTable: 'admin_profiles',
      profileData: {
        admin_level: 3,
        can_manage_admins: true,
        can_manage_permissions: true,
        can_access_billing: true,
        can_access_logs: true,
      },
    },
  ];

  for (const userData of users) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
        continue;
      }

      // Create merchant record if role is merchant
      let merchantId = null;
      if (userData.role === 'merchant') {
        const { data: merchant, error: merchantError } = await supabase
          .from('merchants')
          .insert({
            store_name: 'Test Merchant Store',
            store_slug: 'test-merchant-store',
            email: userData.email,
            migration_status: 'completed',
            status: 'active',
          })
          .select()
          .single();

        if (merchantError) {
          console.error(`❌ Failed to create merchant for ${userData.email}:`, merchantError.message);
          continue;
        }

        merchantId = merchant.id;
      }

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          full_name: userData.full_name,
          role: userData.role,
          status: 'active',
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error(`❌ Failed to create user ${userData.email}:`, userError.message);
        continue;
      }

      // Create role-specific profile
      const profileData = { ...userData.profileData, user_id: user.id };
      if (userData.role === 'merchant' && merchantId) {
        profileData.merchant_id = merchantId;
      }

      const { error: profileError } = await supabase
        .from(userData.profileTable)
        .insert(profileData);

      if (profileError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, profileError.message);
        // Don't continue - user was created but profile failed
      }

      // Log the creation
      await supabase.from('auth_audit_log').insert({
        user_id: user.id,
        action: 'user_created',
        resource: 'users',
        resource_id: user.id,
        new_values: {
          email: userData.email,
          role: userData.role,
        },
        ip_address: '127.0.0.1',
        user_agent: 'Test Script',
        success: true,
      });

      console.log(`✅ Created ${userData.role.toUpperCase()}: ${userData.email}`);
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }

  console.log('\n🎉 Test user creation complete!\n');
  console.log('Test Users Created:');
  console.log('==================');
  console.log('CUSTOMER:  customer@test.com / *@123');
  console.log('MERCHANT:  merchant@test.com / *@123');
  console.log('SUPPORT:   support@test.com  / *@123');
  console.log('ADMIN:     admin@test.com    / *@123');
  console.log('\nAll users are active and email verified.');
}

createTestUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
