import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');
const db = new Database(DB_PATH);

console.log('Verifying Support Tickets...');

const tickets = db.prepare("SELECT * FROM support_tickets").all();
console.log(`- Total tickets: ${tickets.length}`);

if (tickets.length === 0) {
    console.log('  Creating sample tickets...');
    const insertTicket = db.prepare(`
        INSERT INTO support_tickets (
            id, subject, body, category, priority, status, 
            source, sentiment_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    
    const sampleTickets = [
        {
            id: 'tkt_001',
            subject: 'Payment Failed during Checkout',
            body: 'I tried to buy the Quantum Headphones but my card keeps getting declined. I have sufficient funds.',
            category: 'payment',
            priority: 'high',
            status: 'open',
            source: 'email',
            sentiment_score: 0.2
        },
        {
            id: 'tkt_002',
            subject: 'Where is my order?',
            body: 'Order #ORD-7782 was supposed to arrive yesterday. Tracking hasn\'t updated.',
            category: 'general',
            priority: 'medium',
            status: 'open',
            source: 'chat',
            sentiment_score: 0.4
        },
        {
            id: 'tkt_003',
            subject: 'API Rate Limit Issues',
            body: 'Our integration is hitting rate limits constantly despite being on the Pro plan.',
            category: 'api',
            priority: 'high',
            status: 'in_progress',
            source: 'manual',
            sentiment_score: 0.3
        }
    ];

    for (const t of sampleTickets) {
        insertTicket.run(t.id, t.subject, t.body, t.category, t.priority, t.status, t.source, t.sentiment_score, now, now);
    }
    console.log(`  ✅ Created ${sampleTickets.length} sample tickets.`);
} else {
    console.log('  ✅ Tickets already exist.');
}
