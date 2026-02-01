-- ============================================
-- CREATE TEST USERS FOR EACH ROLE
-- ============================================

-- RECOMMENDED: Use the Node.js script instead for proper PBKDF2 hashing
-- Run: npm install tsx && npx tsx scripts/create-test-users.ts

-- This SQL script creates users with a simple hash for demonstration.
-- For production-grade security, use the Node.js script which uses proper PBKDF2.

-- Password for all test users: *@123

-- ============================================
-- NOTE ON PASSWORD HASHING
-- ============================================

/*
  The auth service uses PBKDF2 with 100,000 iterations via Web Crypto API.
  PostgreSQL doesn't have native PBKDF2 support, so this script uses a
  simplified approach with pgcrypto.

  For proper PBKDF2 hashing, use the Node.js script:
  npx tsx scripts/create-test-users.ts
*/

-- ============================================
-- CREATE TEST USERS
-- ============================================

DO $$
DECLARE
  v_customer_id UUID;
  v_merchant_id UUID;
  v_support_id UUID;
  v_admin_id UUID;
  v_merchant_merchant_id UUID;
BEGIN
  -- ============================================
  -- 1. CUSTOMER USER
  -- ============================================

  -- Check if user exists
  SELECT id INTO v_customer_id FROM users WHERE email = 'customer@test.com';

  IF v_customer_id IS NULL THEN
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      status,
      email_verified,
      email_verified_at
    ) VALUES (
      'customer@test.com',
      NULL, -- Will be set via signup or script
      'Test Customer',
      'customer',
      'pending_verification', -- Will be activated after setting password
      false,
      NULL
    ) RETURNING id INTO v_customer_id;

    -- Create customer profile
    INSERT INTO customer_profiles (user_id) VALUES (v_customer_id);

    RAISE NOTICE 'Created customer user: customer@test.com (password not set - use signup)';
  ELSE
    RAISE NOTICE 'Customer user already exists';
  END IF;

  -- ============================================
  -- 2. MERCHANT USER
  -- ============================================

  SELECT id INTO v_merchant_id FROM users WHERE email = 'merchant@test.com';

  IF v_merchant_id IS NULL THEN
    -- First create a merchant record
    INSERT INTO merchants (
      store_name,
      store_slug,
      email,
      migration_status,
      status
    ) VALUES (
      'Test Merchant Store',
      'test-merchant-store',
      'merchant@test.com',
      'completed',
      'active'
    ) RETURNING id INTO v_merchant_merchant_id;

    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      status,
      email_verified,
      email_verified_at
    ) VALUES (
      'merchant@test.com',
      NULL,
      'Test Merchant',
      'merchant',
      'pending_verification',
      false,
      NULL
    ) RETURNING id INTO v_merchant_id;

    -- Create merchant profile
    INSERT INTO merchant_profiles (
      user_id,
      merchant_id,
      business_name,
      business_email,
      verification_status
    ) VALUES (
      v_merchant_id,
      v_merchant_merchant_id,
      'Test Merchant Store',
      'merchant@test.com',
      'verified'
    );

    RAISE NOTICE 'Created merchant user: merchant@test.com (password not set - use signup)';
  ELSE
    RAISE NOTICE 'Merchant user already exists';
  END IF;

  -- ============================================
  -- 3. SUPPORT USER
  -- ============================================

  SELECT id INTO v_support_id FROM users WHERE email = 'support@test.com';

  IF v_support_id IS NULL THEN
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      status,
      email_verified,
      email_verified_at
    ) VALUES (
      'support@test.com',
      NULL,
      'Test Support Agent',
      'support',
      'pending_verification',
      false,
      NULL
    ) RETURNING id INTO v_support_id;

    -- Create support profile
    INSERT INTO support_profiles (
      user_id,
      employee_id,
      department,
      specializations,
      is_available
    ) VALUES (
      v_support_id,
      'SUP-001',
      'general',
      ARRAY['migration', 'api', 'checkout'],
      true
    );

    RAISE NOTICE 'Created support user: support@test.com (password not set - use signup)';
  ELSE
    RAISE NOTICE 'Support user already exists';
  END IF;

  -- ============================================
  -- 4. ADMIN USER
  -- ============================================

  SELECT id INTO v_admin_id FROM users WHERE email = 'admin@test.com';

  IF v_admin_id IS NULL THEN
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      role,
      status,
      email_verified,
      email_verified_at
    ) VALUES (
      'admin@test.com',
      NULL,
      'Test Admin',
      'admin',
      'pending_verification',
      false,
      NULL
    ) RETURNING id INTO v_admin_id;

    -- Create admin profile
    INSERT INTO admin_profiles (
      user_id,
      admin_level,
      can_manage_admins,
      can_manage_permissions,
      can_access_billing,
      can_access_logs
    ) VALUES (
      v_admin_id,
      3, -- Super admin
      true,
      true,
      true,
      true
    );

    RAISE NOTICE 'Created admin user: admin@test.com (password not set - use signup)';
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;

END $$;

-- ============================================
-- INSTRUCTIONS
-- ============================================

/*
  ⚠️  IMPORTANT: Passwords are not set by this SQL script!

  TO SET PASSWORDS:

  OPTION 1 (Recommended): Use the Node.js script
    npm install tsx
    npx tsx scripts/create-test-users.ts

  OPTION 2: Use the signup flow in the UI
    Go to /auth/signup and create each account manually

  OPTION 3: Manually activate the accounts via Supabase Dashboard
    1. Go to Table Editor → users
    2. For each test user, set:
       - status = 'active'
       - email_verified = true
       - email_verified_at = current timestamp
    3. Then use forgot password flow to set passwords

  Test User Emails Created:
  - customer@test.com (role: customer)
  - merchant@test.com (role: merchant)
  - support@test.com (role: support)
  - admin@test.com (role: admin)
*/
