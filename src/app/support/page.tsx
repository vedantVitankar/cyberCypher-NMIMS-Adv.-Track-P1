'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  created_at: string;
  sentiment_score: number;
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/support/tickets');
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Support Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">
              {tickets.filter(t => t.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Urgent Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">
              {tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-neutral-100">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-neutral-400 text-center py-8">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-neutral-400 text-center py-8">No tickets found.</div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link 
                  href={`/support/tickets/${ticket.id}`} 
                  key={ticket.id}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-neutral-950/50 hover:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(ticket.status)}
                      <div>
                        <h3 className="font-medium text-neutral-200 group-hover:text-blue-400 transition-colors">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                          <span>#{ticket.id}</span>
                          <span>•</span>
                          <span className="capitalize">{ticket.category}</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ticket.sentiment_score < 0.4 && (
                        <Badge variant="outline" className="text-red-400 border-red-900 bg-red-950/30">
                          Negative Sentiment
                        </Badge>
                      )}
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
