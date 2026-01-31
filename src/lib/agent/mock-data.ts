// ============================================
// MOCK DATA GENERATOR
// For testing and demonstration
// ============================================

import { supabase } from '@/lib/supabase';

// Sample merchant data
const MOCK_MERCHANTS = [
  { store_name: 'TechGadgets Pro', store_slug: 'techgadgets-pro', email: 'support@techgadgets.com', status: 'active', migration_status: 'completed', migration_stage: 100 },
  { store_name: 'Fashion Forward', store_slug: 'fashion-forward', email: 'help@fashionforward.io', status: 'active', migration_status: 'in_progress', migration_stage: 75 },
  { store_name: 'Home & Living', store_slug: 'home-living', email: 'contact@homeliving.store', status: 'migrating', migration_status: 'in_progress', migration_stage: 45 },
  { store_name: 'Sports Elite', store_slug: 'sports-elite', email: 'team@sportselite.com', status: 'active', migration_status: 'completed', migration_stage: 100 },
  { store_name: 'Organic Foods Co', store_slug: 'organic-foods', email: 'hello@organicfoods.co', status: 'onboarding', migration_status: 'not_started', migration_stage: 0 },
  { store_name: 'Digital Downloads', store_slug: 'digital-downloads', email: 'support@digitaldownloads.net', status: 'active', migration_status: 'completed', migration_stage: 100 },
  { store_name: 'Pet Paradise', store_slug: 'pet-paradise', email: 'woof@petparadise.shop', status: 'migrating', migration_status: 'in_progress', migration_stage: 60 },
  { store_name: 'Artisan Crafts', store_slug: 'artisan-crafts', email: 'create@artisancrafts.com', status: 'active', migration_status: 'completed', migration_stage: 100 },
];

// Sample support ticket templates
const TICKET_TEMPLATES = [
  // Migration issues
  { subject: 'Checkout not working after migration', body: 'After completing the migration to headless, our checkout is completely broken. Customers can add items to cart but get a 500 error when trying to pay.', category: 'checkout', priority: 'urgent' },
  { subject: 'API returns 401 on all requests', body: 'Since switching to the new headless API, all our requests return 401 Unauthorized even though we set up the API keys correctly.', category: 'api', priority: 'high' },
  { subject: 'Webhooks stopped working', body: 'Our order webhooks were working fine before migration but now we dont receive any webhook calls. Orders are coming through but our fulfillment system isnt getting notified.', category: 'webhook', priority: 'high' },
  { subject: 'Product images not loading', body: 'After migration, none of our product images are loading on the storefront. The URLs seem different than before.', category: 'migration', priority: 'medium' },
  { subject: 'How to configure webhooks in headless?', body: 'I cannot find documentation on how to set up webhooks for the new headless platform. Where do I configure these?', category: 'webhook', priority: 'low' },

  // Checkout/Payment issues
  { subject: 'Payment failed but order created', body: 'Customer was charged on Stripe but the order shows as failed in our dashboard. This has happened 3 times today.', category: 'payment', priority: 'urgent' },
  { subject: 'Stripe connection lost', body: 'Getting "Stripe not connected" error when customers try to checkout. Was working yesterday.', category: 'payment', priority: 'urgent' },
  { subject: 'Cart total mismatch', body: 'The cart total shown to customers doesnt match what we receive in the order. Discounts seem to not be applying correctly.', category: 'checkout', priority: 'high' },

  // API issues
  { subject: 'Rate limiting errors', body: 'We are getting 429 Too Many Requests errors during peak hours. Our traffic hasnt increased.', category: 'api', priority: 'medium' },
  { subject: 'Slow API responses', body: 'API responses that used to take 200ms are now taking 3-5 seconds. This is affecting our page load times.', category: 'api', priority: 'high' },
  { subject: 'Product sync failing', body: 'The product sync API keeps timing out when we try to update our catalog of 10,000 products.', category: 'api', priority: 'medium' },

  // General
  { subject: 'Need documentation for inventory API', body: 'Looking for docs on how to use the inventory management API. Cant find it in the developer portal.', category: 'general', priority: 'low' },
  { subject: 'Feature request: bulk order export', body: 'Would be great to have a bulk export option for orders. Currently can only export one at a time.', category: 'general', priority: 'low' },
];

// Sample API error logs
const API_ERROR_TEMPLATES = [
  { endpoint: '/api/v2/checkout/create', method: 'POST', status_code: 500, error_message: 'Internal server error: database connection timeout' },
  { endpoint: '/api/v2/products', method: 'GET', status_code: 401, error_message: 'Invalid or expired API key' },
  { endpoint: '/api/v2/orders', method: 'POST', status_code: 400, error_message: 'Invalid shipping address format' },
  { endpoint: '/api/v2/webhooks/register', method: 'POST', status_code: 422, error_message: 'Webhook URL not reachable' },
  { endpoint: '/api/v2/inventory/update', method: 'PUT', status_code: 504, error_message: 'Gateway timeout' },
  { endpoint: '/api/v2/cart/add', method: 'POST', status_code: 500, error_message: 'Failed to calculate tax' },
  { endpoint: '/api/v2/checkout/confirm', method: 'POST', status_code: 402, error_message: 'Payment declined' },
];

// Sample webhook failures
const WEBHOOK_FAILURE_TEMPLATES = [
  { event_type: 'order.created', last_error: 'Connection refused: ECONNREFUSED' },
  { event_type: 'order.fulfilled', last_error: 'SSL certificate error' },
  { event_type: 'payment.captured', last_error: 'Endpoint returned 500' },
  { event_type: 'inventory.updated', last_error: 'Request timeout after 30s' },
  { event_type: 'customer.created', last_error: 'Invalid response format' },
];

// Sample checkout failures
const CHECKOUT_FAILURE_TEMPLATES = [
  { failure_reason: 'Payment declined by card issuer', error_code: 'card_declined' },
  { failure_reason: 'Insufficient funds', error_code: 'insufficient_funds' },
  { failure_reason: 'Card expired', error_code: 'expired_card' },
  { failure_reason: 'Stripe API error: rate limit exceeded', error_code: 'rate_limit' },
  { failure_reason: 'Invalid shipping address', error_code: 'invalid_address' },
  { failure_reason: 'Cart validation failed: product out of stock', error_code: 'out_of_stock' },
  { failure_reason: 'Tax calculation service unavailable', error_code: 'tax_service_error' },
];

// Helper to get random item
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random date in last N hours
function randomDate(hoursAgo: number): string {
  const now = Date.now();
  const offset = Math.random() * hoursAgo * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

// Generate mock data
export async function generateMockData(options: {
  merchants?: number;
  tickets?: number;
  apiErrors?: number;
  webhookFailures?: number;
  checkoutFailures?: number;
} = {}): Promise<{
  merchants: string[];
  tickets: number;
  apiErrors: number;
  webhookFailures: number;
  checkoutFailures: number;
}> {
  const config = {
    merchants: options.merchants ?? 8,
    tickets: options.tickets ?? 15,
    apiErrors: options.apiErrors ?? 20,
    webhookFailures: options.webhookFailures ?? 10,
    checkoutFailures: options.checkoutFailures ?? 12,
  };

  console.log('📦 Generating mock data...');

  // Create merchants
  const merchantIds: string[] = [];
  for (let i = 0; i < Math.min(config.merchants, MOCK_MERCHANTS.length); i++) {
    const merchantData = MOCK_MERCHANTS[i];
    const { data, error } = await supabase
      .from('merchants')
      .insert({
        ...merchantData,
        api_key_configured: Math.random() > 0.3,
        webhook_configured: Math.random() > 0.4,
        stripe_connected: Math.random() > 0.2,
        migration_started_at: merchantData.migration_stage > 0 ? randomDate(168) : null,
        migration_completed_at: merchantData.migration_stage === 100 ? randomDate(48) : null,
      })
      .select('id')
      .single();

    if (!error && data) {
      merchantIds.push(data.id);
    }
  }
  console.log(`   Created ${merchantIds.length} merchants`);

  // Create support tickets
  let ticketsCreated = 0;
  for (let i = 0; i < config.tickets; i++) {
    const template = randomItem(TICKET_TEMPLATES);
    const merchantId = randomItem(merchantIds);

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        merchant_id: merchantId,
        subject: template.subject,
        body: template.body,
        category: template.category,
        priority: template.priority,
        status: randomItem(['open', 'open', 'open', 'in_progress', 'waiting']),
        source: randomItem(['email', 'email', 'chat', 'phone']),
        created_at: randomDate(24),
      });

    if (!error) ticketsCreated++;
  }
  console.log(`   Created ${ticketsCreated} support tickets`);

  // Create API error logs
  let apiErrorsCreated = 0;
  for (let i = 0; i < config.apiErrors; i++) {
    const template = randomItem(API_ERROR_TEMPLATES);
    const merchantId = randomItem(merchantIds);

    const { error } = await supabase
      .from('merchant_api_logs')
      .insert({
        merchant_id: merchantId,
        endpoint: template.endpoint,
        method: template.method,
        status_code: template.status_code,
        error_message: template.error_message,
        duration_ms: Math.floor(Math.random() * 5000) + 100,
        created_at: randomDate(2),
      });

    if (!error) apiErrorsCreated++;
  }
  console.log(`   Created ${apiErrorsCreated} API error logs`);

  // Create webhook failures
  let webhookFailuresCreated = 0;
  for (let i = 0; i < config.webhookFailures; i++) {
    const template = randomItem(WEBHOOK_FAILURE_TEMPLATES);
    const merchantId = randomItem(merchantIds);

    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        merchant_id: merchantId,
        event_type: template.event_type,
        payload: { order_id: `order_${Math.random().toString(36).slice(2, 10)}` },
        delivery_status: 'failed',
        retry_count: Math.floor(Math.random() * 5) + 1,
        last_error: template.last_error,
        created_at: randomDate(4),
      });

    if (!error) webhookFailuresCreated++;
  }
  console.log(`   Created ${webhookFailuresCreated} webhook failures`);

  // Create checkout failures
  let checkoutFailuresCreated = 0;
  for (let i = 0; i < config.checkoutFailures; i++) {
    const template = randomItem(CHECKOUT_FAILURE_TEMPLATES);
    const merchantId = randomItem(merchantIds);

    const { error } = await supabase
      .from('checkout_sessions')
      .insert({
        merchant_id: merchantId,
        customer_email: `customer${i}@example.com`,
        cart_total: Math.floor(Math.random() * 500) + 20,
        status: 'failed',
        failure_reason: template.failure_reason,
        error_code: template.error_code,
        created_at: randomDate(6),
      });

    if (!error) checkoutFailuresCreated++;
  }
  console.log(`   Created ${checkoutFailuresCreated} checkout failures`);

  console.log('✅ Mock data generation complete');

  return {
    merchants: merchantIds,
    tickets: ticketsCreated,
    apiErrors: apiErrorsCreated,
    webhookFailures: webhookFailuresCreated,
    checkoutFailures: checkoutFailuresCreated,
  };
}

// Clear all mock data
export async function clearMockData(): Promise<void> {
  console.log('🗑️ Clearing mock data...');

  await supabase.from('reasoning_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agent_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('support_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('checkout_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('webhook_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('merchant_api_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('merchants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✅ Mock data cleared');
}

// Simulate a migration crisis scenario
export async function simulateMigrationCrisis(merchantIds: string[]): Promise<void> {
  console.log('🚨 Simulating migration crisis...');

  // Pick 3 merchants to be "affected"
  const affectedMerchants = merchantIds.slice(0, 3);

  // Create a burst of related errors
  for (const merchantId of affectedMerchants) {
    // API errors from same endpoint
    for (let i = 0; i < 5; i++) {
      await supabase.from('merchant_api_logs').insert({
        merchant_id: merchantId,
        endpoint: '/api/v2/checkout/create',
        method: 'POST',
        status_code: 500,
        error_message: 'Internal server error: payment processor unreachable',
        duration_ms: 30000,
        created_at: randomDate(0.5),
      });
    }

    // Checkout failures
    for (let i = 0; i < 3; i++) {
      await supabase.from('checkout_sessions').insert({
        merchant_id: merchantId,
        customer_email: `crisis_customer${i}@example.com`,
        cart_total: Math.floor(Math.random() * 200) + 50,
        status: 'failed',
        failure_reason: 'Payment processor connection timeout',
        error_code: 'gateway_timeout',
        created_at: randomDate(0.25),
      });
    }

    // Urgent support tickets
    await supabase.from('support_tickets').insert({
      merchant_id: merchantId,
      subject: 'URGENT: All checkouts failing since 10 minutes ago',
      body: 'Our checkout has completely stopped working. Every customer is getting an error. This is costing us thousands in lost sales. Please help immediately!',
      category: 'checkout',
      priority: 'urgent',
      status: 'open',
      source: 'chat',
      created_at: new Date().toISOString(),
    });
  }

  console.log(`✅ Crisis simulated for ${affectedMerchants.length} merchants`);
}
