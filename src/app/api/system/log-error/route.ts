
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { error, errorInfo, url, source = 'auto_detected', type = 'System Error' } = body;

    const ticketId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const subject = `${type}: ${error.message || 'Unknown Error'}`;
    
    // Format the body to include stack trace and context
    const description = `
${type} Detected
---------------------
Message: ${error.message || 'No message provided'}
Source: ${source}
URL: ${url || 'Unknown URL'}
Time: ${new Date().toISOString()}

Stack Trace:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

User Agent:
${req.headers.get('user-agent') || 'Unknown'}
    `.trim();

    // Insert into support_tickets
    const stmt = db.instance.prepare(`
      INSERT INTO support_tickets (
        id, 
        subject, 
        body, 
        category, 
        priority, 
        status, 
        source,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      ticketId,
      subject,
      description,
      'technical', // category
      'high',      // priority
      'open',      // status
      source       // source
    );

    return NextResponse.json({ success: true, ticketId });
  } catch (err) {
    console.error('Failed to log error to DB:', err);
    return NextResponse.json({ success: false, error: 'Internal logging failed' }, { status: 500 });
  }
}
