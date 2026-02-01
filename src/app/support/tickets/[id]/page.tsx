'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Bot, Play, Loader2, Terminal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  created_at: string;
  sentiment_score: number;
  agent_response?: string;
  agent_confidence?: number;
}

interface AgentStep {
  id: number;
  message: string;
  type: 'info' | 'search' | 'success' | 'analysis' | 'decision' | 'action';
  timestamp: number;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Agent Simulation State
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentStep[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('Idle');

  // Mock ticket data for simulation consistency
  const MOCK_TICKET: Ticket = {
    id: 'TKT-1293',
    subject: 'Return request for recent order',
    body: "Hi, I recently bought the Cosmic Headphones (Order #ORD-7829) but they don't fit well. Can I get a refund? I've only had them for a few days.",
    category: 'returns',
    priority: 'medium',
    status: 'open',
    source: 'email',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    sentiment_score: 0.45,
  };

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/support/tickets/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Check if we found a real ticket, otherwise fall back to mock for demo
          if (data.ticket) {
            setTicket(data.ticket);
            if (data.ticket.agent_response) {
              setReply(data.ticket.agent_response);
            }
          } else {
            setTicket(MOCK_TICKET);
          }
        } else {
          // Fallback to mock ticket if API fails (for demo purposes)
          console.log('Using mock ticket for simulation');
          setTicket(MOCK_TICKET);
        }
      } catch (error) {
        console.error('Failed to fetch ticket, using mock:', error);
        setTicket(MOCK_TICKET);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTicket();
  }, [id]);

  const runAgentSimulation = async () => {
    setIsAgentRunning(true);
    setAgentLogs([]);
    setAgentStatus('Initializing...');

    const steps = [
      { message: 'Reading ticket context...', type: 'info', delay: 800 },
      { message: 'Analyzing sentiment and intent...', type: 'analysis', delay: 1500 },
      { message: 'Intent detected: "Request Refund"', type: 'success', delay: 1000 },
      { message: `Searching order history for user...`, type: 'search', delay: 1200 },
      { message: 'Order #ORD-7829 found. Status: Delivered.', type: 'success', delay: 1000 },
      { message: 'Checking return window policy (30 days)...', type: 'info', delay: 1500 },
      { message: 'Item within return window. Refund eligible.', type: 'success', delay: 1000 },
      { message: 'Drafting response and initiating refund process...', type: 'action', delay: 2000 },
      { message: 'Refund #REF-9921 initiated successfully.', type: 'success', delay: 1000 },
      { message: 'Ticket marked for resolution.', type: 'decision', delay: 800 },
    ];

    let currentDelay = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      currentDelay += step.delay;
      
      setTimeout(() => {
        setAgentLogs(prev => [...prev, {
          id: i,
          message: step.message,
          type: step.type as any,
          timestamp: Date.now()
        }]);
        setAgentStatus(step.message);
        
        // Auto-scroll to bottom of logs
        const logContainer = document.getElementById('agent-logs');
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      }, currentDelay);
    }

    // Finalize
    setTimeout(() => {
      setAgentStatus('Resolution Complete');
      setReply(`Hello,

I've processed your refund request for Order #ORD-7829. 

Since your item is within the 30-day return window, I've automatically initiated a full refund of $45.00 to your original payment method (Refund Reference: #REF-9921).

You should see the funds appear in your account within 3-5 business days.

Is there anything else I can help you with today?

Best regards,
Cosmic Support Agent`);
      
      // Update local ticket status visually
      if (ticket) {
        setTicket({ ...ticket, status: 'resolved' });
      }
      setIsAgentRunning(false);
    }, currentDelay + 1000);
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'resolved',
          agent_response: reply 
        }),
      });

      if (res.ok) {
        router.push('/support');
      }
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-neutral-400">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-neutral-400">Ticket not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/support">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
            <span>Ticket #{ticket.id}</span>
            <span>•</span>
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-100">Customer Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {ticket.body}
              </p>
            </CardContent>
          </Card>

          {/* Agent Simulation Overlay / View */}
          {isAgentRunning || agentLogs.length > 0 ? (
            <Card className="bg-neutral-950 border-blue-900/50 relative overflow-hidden">
               {isAgentRunning && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-900/20">
                   <div className="h-full bg-blue-500 animate-progress-indeterminate"></div>
                 </div>
               )}
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-blue-900/20 bg-blue-950/10">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-lg text-blue-100">Agent Workspace</CardTitle>
                </div>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-950/30 animate-pulse">
                  {isAgentRunning ? 'RUNNING' : 'COMPLETED'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 min-h-[300px] flex flex-col font-mono text-sm">
                <div id="agent-logs" className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-2">
                  {agentLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-neutral-500 text-xs w-[60px] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div className="flex-1">
                        <span className={cn(
                          "font-bold mr-2 text-xs px-1.5 py-0.5 rounded",
                          log.type === 'info' && "bg-neutral-800 text-neutral-300",
                          log.type === 'search' && "bg-blue-900/30 text-blue-400",
                          log.type === 'success' && "bg-green-900/30 text-green-400",
                          log.type === 'analysis' && "bg-purple-900/30 text-purple-400",
                          log.type === 'decision' && "bg-orange-900/30 text-orange-400",
                          log.type === 'action' && "bg-red-900/30 text-red-400",
                        )}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-neutral-300">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  {isAgentRunning && (
                    <div className="flex items-center gap-2 text-blue-400 mt-2 pl-[72px] animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-neutral-100">Response</CardTitle>
              <div className="flex items-center gap-2">
                {!isAgentRunning && (
                   <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 border-purple-500/50 text-purple-400 hover:bg-purple-950/30 hover:text-purple-300"
                    onClick={runAgentSimulation}
                  >
                    <Play className="h-3 w-3 mr-1.5" />
                    Auto-Resolve with Agent
                  </Button>
                )}
                <Badge variant="outline" className="border-blue-900 bg-blue-950/30 text-blue-400 flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  AI Suggested
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[200px] bg-neutral-950 border-neutral-800 text-neutral-100 resize-none focus:ring-orange-500"
              />
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  onClick={() => router.push('/support')}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  onClick={handleResolve}
                  disabled={isSubmitting || !reply.trim() || isAgentRunning}
                >
                  <Send className="h-4 w-4" />
                  Send & Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-400">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500">Status</label>
                <div className="mt-1">
                  <Badge className={cn(
                    "capitalize",
                    ticket.status === 'resolved' 
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                  )}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500">Priority</label>
                <div className="mt-1">
                  <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 capitalize">
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500">Category</label>
                <div className="mt-1 text-sm text-neutral-300 capitalize">
                  {ticket.category}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500">Source</label>
                <div className="mt-1 text-sm text-neutral-300 capitalize">
                  {ticket.source}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-400">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500">Sentiment Score</label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        ticket.sentiment_score < 0.4 ? "bg-red-500" : 
                        ticket.sentiment_score > 0.7 ? "bg-green-500" : "bg-yellow-500"
                      )}
                      style={{ width: `${ticket.sentiment_score * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">
                    {(ticket.sentiment_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {ticket.sentiment_score < 0.4 && (
                <div className="flex items-start gap-2 p-3 rounded bg-red-950/20 border border-red-900/50 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Customer appears frustrated. Priority handling recommended.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
