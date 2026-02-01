import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockClaude } from '@/lib/agent/mock-claude';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  let ticketId, context;
  try {
    const body = await req.json();
    ticketId = body.ticketId;
    context = body.context;
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Create a TransformStream for streaming the response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to write events to the stream
  const sendEvent = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // State for stream parser (scoped to this request)
  let bufferBuffer = '';
  let finalResolution = '';

  const handleStreamContent = async (content: string) => {
    bufferBuffer += content;

    // Check for newlines to process complete lines
    if (bufferBuffer.includes('\n')) {
      const lines = bufferBuffer.split('\n');
      bufferBuffer = lines.pop() || ''; // Keep last partial line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('LOG:')) {
          const msg = trimmed.replace('LOG:', '').trim();
          await sendEvent({ type: 'analysis', message: msg });
        } else if (trimmed.startsWith('RESOLUTION:')) {
          const msg = trimmed.replace('RESOLUTION:', '').trim();
          finalResolution = msg;
        } else if (finalResolution !== '') {
          // If we are in resolution mode, append
          finalResolution += '\n' + trimmed;
        } else if (trimmed.length > 0) {
           // Fallback: treat as log if it looks like a sentence
           await sendEvent({ type: 'analysis', message: trimmed });
        }
      }
    }
  };

  // Run the agent logic in the background
  (async () => {
    try {
      // 1. Fetch Ticket Context
      await sendEvent({ type: 'info', message: `Initializing Agent for Ticket #${ticketId}...` });

      const ticket = db.instance.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;

      if (!ticket) {
        await sendEvent({ type: 'error', message: 'Ticket not found.' });
        await writer.close();
        return;
      }

      // 2. Prepare Context for LLM
      await sendEvent({ type: 'info', message: 'Analyzing ticket and codebase context...' });

      const systemPrompt = `You are the Tier 3 AI Support Engineer for "Cosmic Commerce" - an e-commerce SaaS platform.
Your goal is to autonomously resolve customer support tickets by analyzing the provided codebase and ticket details.

You have access to:
1. The Ticket Details (Subject, Body, Category)
2. A File Tree of the entire project (to understand architecture)
3. The full content of the most relevant source files (to understand logic)

INSTRUCTIONS:
- Analyze the code to find the root cause of the user's issue
- If it's a bug, explain what is wrong in the code
- If it's a feature request, explain how it works or should work
- Provide a helpful, professional resolution message for the customer
- Be empathetic and customer-focused in your response

OUTPUT FORMAT (Strict - VERY IMPORTANT):
- Use "LOG: <message>" to report your analysis steps (e.g., "LOG: Checking schema.sql for order table definitions...")
- Use "RESOLUTION: <message>" for the final response to the customer
- Each LOG and RESOLUTION must be on a new line

Example Output:
LOG: Analyzing file tree structure...
LOG: Checking src/lib/db/schema.sql for order table definitions...
LOG: Found relevant order processing logic...
LOG: Identified the issue - status column constraint mismatch...
RESOLUTION: Thank you for contacting Cosmic Commerce Support.

I've identified the issue with your order. It appears the order status was stuck due to a processing constraint. I've corrected this, and your order is now proceeding normally.

You should receive a shipping confirmation within 24 hours. If you have any other questions, please don't hesitate to reach out!

Best regards,
Cosmic Commerce Support Team`;

      const userMessage = `Ticket Subject: ${ticket.subject}
Ticket Body: ${ticket.body}
Ticket Category: ${ticket.category}

Codebase Context:
${context || 'No specific codebase context provided.'}`;

      // 3. Initialize Mock Claude AI (Intelligent Simulation)
      await sendEvent({ type: 'search', message: 'Connecting to AI Resolution Engine...' });
      await sendEvent({ type: 'analysis', message: 'AI analyzing ticket and codebase...' });

      // 4. Stream Response from Mock Claude
      const stream = await mockClaude.createMessageStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      });

      // 5. Process streaming chunks
      for await (const content of stream) {
        await handleStreamContent(content);
      }

      // Flush any remaining buffer
      if (bufferBuffer.trim()) {
         await handleStreamContent('\n');
      }

      // Ensure we have a resolution
      if (!finalResolution || finalResolution.trim().length === 0) {
         finalResolution = "Thank you for contacting Cosmic Commerce Support. Your ticket has been analyzed and we're working on resolving your issue. A support specialist will follow up with you shortly.";
      }

      // Update ticket in database
      try {
        db.instance.prepare(`
          UPDATE support_tickets
          SET status = ?, resolution = ?, resolved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run('resolved', finalResolution.trim(), ticketId);
      } catch (dbError) {
        console.error('Database update error:', dbError);
      }

      await sendEvent({ type: 'complete', status: 'resolved', resolution: finalResolution.trim() });

    } catch (error) {
      console.error('Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await sendEvent({ type: 'error', message: 'An error occurred during resolution: ' + errorMessage });
    } finally {
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
