const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');
const db = new Database(DB_PATH);

console.log('Verifying Support Tickets...');

// Re-create the table to ensure the schema is up to date with new categories
console.log('  Recreating support_tickets table...');
db.exec("DROP TABLE IF EXISTS support_tickets");
db.exec(`
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
  external_ticket_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('checkout', 'api', 'webhook', 'migration', 'payment', 'general', 'unknown', 'billing', 'shipping', 'order', 'technical', 'returns', 'feature_request', 'account')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('email', 'chat', 'phone', 'manual', 'auto_detected', 'web', 'app')),
  sentiment_score REAL,
  auto_classified INTEGER DEFAULT 0,
  agent_response TEXT,
  agent_confidence REAL,
  resolution TEXT,
  resolved_by TEXT CHECK (resolved_by IN ('agent', 'human', 'auto_resolved') OR resolved_by IS NULL),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
)
`);

const tickets = []; // Force empty check to always seed
console.log(`- Total tickets: ${tickets.length}`);

if (tickets.length === 0) {
    console.log('  Creating sample tickets...');
    const insertTicket = db.prepare(`
        INSERT INTO support_tickets (
            id, subject, body, category, priority, status, 
            source, sentiment_score, resolution, resolved_by, resolved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    const sampleTickets = [
        // PAYMENT & BILLING (1-4)
        {
            id: 'tkt_001',
            subject: 'Payment Failed during Checkout',
            body: 'I tried to buy the Quantum Headphones but my card keeps getting declined. I have sufficient funds. Error code: PAY_ERR_INVALID_MERCHANT.',
            category: 'payment',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.2,
            resolution: 'Identified misconfiguration in Stripe Connect for this merchant. Reconnected the merchant account. Asked user to retry.',
            resolved_by: null
        },
        {
            id: 'tkt_002',
            subject: 'Double charged for Order #ORD-8921',
            body: 'I see two charges of $129.99 on my statement. Please refund one immediately.',
            category: 'payment',
            priority: 'urgent',
            status: 'open',
            source: 'chat',
            sentiment_score: 0.1,
            resolution: 'Verified transaction logs. Found two identical captures for Order #ORD-8921. Initiated refund of $129.99 via Stripe API (ref: re_3Kx...). Sent confirmation email.',
            resolved_by: null
        },
        {
            id: 'tkt_003',
            subject: 'Invoice request for tax purposes',
            body: 'Can I get a VAT invoice for my last purchase (Order #ORD-7723)?',
            category: 'billing',
            priority: 'low',
            status: 'open',
            source: 'email',
            sentiment_score: 0.6,
            resolution: 'Generated VAT invoice #INV-2024-001 from billing system. Emailed PDF to user.',
            resolved_by: null
        },
        {
            id: 'tkt_004',
            subject: 'Unable to update credit card info',
            body: 'When I try to save my new Visa card, the page spins forever.',
            category: 'payment',
            priority: 'medium',
            status: 'open',
            source: 'web',
            sentiment_score: 0.4,
            resolution: 'Checked logs, found 403 Forbidden on /api/user/payment-methods. Fixed permissions policy for \'update\' action on payment_methods table. User confirmed success.',
            resolved_by: null
        },

        // SHIPPING & ORDERS (5-8)
        {
            id: 'tkt_005',
            subject: 'Where is my order?',
            body: 'Order #ORD-7782 was supposed to arrive yesterday. Tracking hasn\'t updated since Tuesday.',
            category: 'shipping',
            priority: 'medium',
            status: 'open',
            source: 'chat',
            sentiment_score: 0.3,
            resolution: 'Checked FedEx tracking. Package delayed at Memphis hub due to weather. Updated user with new ETA of Thursday.',
            resolved_by: null
        },
        {
            id: 'tkt_006',
            subject: 'Received wrong item',
            body: 'I ordered the Cosmic Black hoodie but received the Galaxy Blue one instead.',
            category: 'order',
            priority: 'medium',
            status: 'open',
            source: 'email',
            sentiment_score: 0.4,
            resolution: 'Verified warehouse pick list. Picker error confirmed. Initiated return label for wrong item and created 0-cost replacement order #ORD-7782-R for Cosmic Black hoodie.',
            resolved_by: null
        },
        {
            id: 'tkt_007',
            subject: 'Change shipping address',
            body: 'I just placed order #ORD-9921 but realized I used my old address. Can you update it to 123 Mars Colony Blvd?',
            category: 'shipping',
            priority: 'high',
            status: 'open',
            source: 'chat',
            sentiment_score: 0.5,
            resolution: 'Order #ORD-9921 status was \'Processing\', so update was possible. Updated shipping_address in database to 123 Mars Colony Blvd. Notified fulfillment center.',
            resolved_by: null
        },
        {
            id: 'tkt_008',
            subject: 'Package marked delivered but not received',
            body: 'FedEx says delivered but I don\'t see it. Please help.',
            category: 'shipping',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.2,
            resolution: 'Initiated trace with FedEx. Driver noted left at \'Front Porch\'. User checked neighbor, found it. Ticket closed.',
            resolved_by: null
        },

        // TECHNICAL / CODE ERRORS (9-14)
        {
            id: 'tkt_009',
            subject: 'API Rate Limit Issues',
            body: 'Our integration is hitting rate limits constantly despite being on the Pro plan. Receiving 429 Too Many Requests.',
            category: 'api',
            priority: 'high',
            status: 'open',
            source: 'manual',
            sentiment_score: 0.3,
            resolution: 'Reviewed usage logs. Merchant was making excessive polling requests (10/sec). Advised implementation of webhooks instead of polling. Temporarily increased limit to 20/sec to allow migration.',
            resolved_by: null
        },
        {
            id: 'tkt_010',
            subject: 'JavaScript Error on Checkout Page',
            body: 'Console shows "Uncaught TypeError: Cannot read property \'price\' of undefined" when clicking Pay Now.',
            category: 'technical',
            priority: 'urgent',
            status: 'open',
            source: 'web',
            sentiment_score: 0.2,
            resolution: 'Debugged `CheckoutForm.tsx`. The `cart.total` object was undefined during initial render. Added optional chaining `cart?.total?.price`. Deployed fix.',
            resolved_by: null
        },
        {
            id: 'tkt_011',
            subject: '500 Internal Server Error on Profile Update',
            body: 'Every time I try to save my profile settings, I get a 500 error. Request ID: req_abc123.',
            category: 'technical',
            priority: 'high',
            status: 'open',
            source: 'web',
            sentiment_score: 0.2,
            resolution: 'Investigated server logs. Found SQL syntax error in `updateProfile` server action. Fixed quote escaping in raw query. Deployed patch.',
            resolved_by: null
        },
        {
            id: 'tkt_012',
            subject: 'OAuth Login Failing with Google',
            body: 'Login with Google redirects to a 404 page. The callback URL seems malformed.',
            category: 'technical',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.3,
            resolution: 'Checked Google Cloud Console. The Authorized Redirect URI was missing \'https://\' prefix. Corrected the URI configuration. Login works now.',
            resolved_by: null
        },
        {
            id: 'tkt_013',
            subject: 'Product Image Upload Failed',
            body: 'Uploading a PNG fails with "S3 Access Denied". We need to update our catalog ASAP.',
            category: 'technical',
            priority: 'medium',
            status: 'open',
            source: 'web',
            sentiment_score: 0.4,
            resolution: 'Checked IAM policy for the S3 bucket. The `PutObject` permission was missing for the `merchant-upload-role`. Added policy. Uploads now succeeding.',
            resolved_by: null
        },
        {
            id: 'tkt_014',
            subject: 'Search indexing is lagging',
            body: 'New products added 4 hours ago are still not showing up in search results.',
            category: 'technical',
            priority: 'medium',
            status: 'open',
            source: 'manual',
            sentiment_score: 0.5,
            resolution: 'Restarted the search indexing worker process which was stuck. Cleared Redis cache. New products appeared in search within 5 minutes.',
            resolved_by: null
        },

        // RETURNS & REFUNDS (15-17)
        {
            id: 'tkt_015',
            subject: 'Return request for Headphones',
            body: 'I want to return the headphones I bought last week. They hurt my ears.',
            category: 'returns',
            priority: 'medium',
            status: 'open',
            source: 'web',
            sentiment_score: 0.5,
            resolution: 'Approved return request #RET-881. Generated prepaid shipping label. Instructions sent to user.',
            resolved_by: null
        },
        {
            id: 'tkt_016',
            subject: 'Refund not received yet',
            body: 'You approved my refund 10 days ago but I still don\'t see it. Refund ID: REF-9988.',
            category: 'returns',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.1,
            resolution: 'Traced refund ARN. Bank acknowledged receipt but user\'s bank statement is slow. Provided ARN to user to check with their bank.',
            resolved_by: null
        },
        {
            id: 'tkt_017',
            subject: 'Item damaged in transit',
            body: 'The box arrived crushed and the screen is cracked. Photos attached. Need replacement.',
            category: 'returns',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.1,
            resolution: 'Apologized for damage. Requested replacement order #ORD-DAM-001. Filed claim with carrier using user\'s photos.',
            resolved_by: null
        },

        // FEATURE REQUESTS & GENERAL (18-20)
        {
            id: 'tkt_018',
            subject: 'Feature Request: Dark Mode for Mobile App',
            body: 'Please add dark mode to the iOS app. My eyes hurt at night.',
            category: 'feature_request',
            priority: 'low',
            status: 'open',
            source: 'app',
            sentiment_score: 0.7,
            resolution: 'Added request to product backlog (Item #FR-442). Notified user it\'s scheduled for Q3 release.',
            resolved_by: null
        },
        {
            id: 'tkt_019',
            subject: 'Partnership Inquiry',
            body: 'We are a logistics company looking to partner with Cosmic Commerce for last-mile delivery.',
            category: 'general',
            priority: 'low',
            status: 'open',
            source: 'email',
            sentiment_score: 0.8,
            resolution: 'Forwarded inquiry to Business Development team (partnerships@cosmic.com). Sent standard acknowledgement to sender.',
            resolved_by: null
        },
        {
            id: 'tkt_020',
            subject: 'Account Deletion Request',
            body: 'Please delete my account and all associated data per GDPR compliance.',
            category: 'account',
            priority: 'medium',
            status: 'open',
            source: 'email',
            sentiment_score: 0.5,
            resolution: 'Verified identity. Executed `deleteUser` script. Removed all PII from primary DB and logs. Sent final confirmation.',
            resolved_by: null
        }
    ];

    for (const t of sampleTickets) {
        insertTicket.run(
            t.id, t.subject, t.body, t.category, t.priority, t.status, 
            t.source, t.sentiment_score, t.resolution, t.resolved_by, null, now, now
        );
    }
    console.log(`  ✅ Created ${sampleTickets.length} sample tickets.`);
} else {
    console.log('  ✅ Tickets already exist.');
}
