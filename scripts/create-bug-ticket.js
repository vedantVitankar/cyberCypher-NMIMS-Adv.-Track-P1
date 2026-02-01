const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cosmic.db');
const db = new Database(DB_PATH);

console.log('Inserting Bug Report Ticket...');

const insertTicket = db.prepare(`
    INSERT INTO support_tickets (
        id, subject, body, category, priority, status, 
        source, sentiment_score, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

try {
    insertTicket.run(
        'TKT-BUG-001',
        'Checkout 500 Error',
        'I am unable to complete my purchase. Every time I click "Pay", I get a server error message. I checked the network tab and it says "500 Internal Server Error" for the payment-intent endpoint.',
        'payment',
        'high',
        'open',
        'web',
        0.1,
        now,
        now
    );
    console.log('Ticket TKT-BUG-001 inserted successfully.');
} catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        console.log('Ticket TKT-BUG-001 already exists.');
    } else {
        console.error('Error inserting ticket:', error);
    }
}
