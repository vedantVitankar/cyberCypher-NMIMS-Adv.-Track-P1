'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    async function fetchTickets() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        
        const res = await fetch(`/api/support/tickets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Use mock data if API returns empty (for demo/simulation)
          if (!data.tickets || data.tickets.length === 0) {
            setTickets([{
              id: 'TKT-1293',
              subject: 'Return request for recent order',
              category: 'returns',
              priority: 'medium',
              status: 'open',
              source: 'email',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              sentiment_score: 0.45,
            }]);
          } else {
            setTickets(data.tickets);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        // Fallback to mock ticket
        setTickets([{
          id: 'TKT-1293',
          subject: 'Return request for recent order',
          category: 'returns',
          priority: 'medium',
          status: 'open',
          source: 'email',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          sentiment_score: 0.45,
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTickets();
  }, [statusFilter, priorityFilter]);

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

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-100">All Tickets</h1>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          Create Ticket
        </Button>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100 focus:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-neutral-950 border-neutral-800 text-neutral-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px] bg-neutral-950 border-neutral-800 text-neutral-100">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-neutral-400 text-center py-8">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-neutral-400 text-center py-8">No tickets found.</div>
          ) : (
            <div className="rounded-md border border-neutral-800">
              <Table>
                <TableHeader className="bg-neutral-950">
                  <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
                    <TableHead className="text-neutral-400">ID</TableHead>
                    <TableHead className="text-neutral-400">Subject</TableHead>
                    <TableHead className="text-neutral-400">Status</TableHead>
                    <TableHead className="text-neutral-400">Priority</TableHead>
                    <TableHead className="text-neutral-400">Sentiment</TableHead>
                    <TableHead className="text-neutral-400">Created</TableHead>
                    <TableHead className="text-right text-neutral-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell className="font-mono text-xs text-neutral-500">
                        {ticket.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-neutral-200">{ticket.subject}</div>
                        <div className="text-xs text-neutral-500 capitalize">{ticket.category} • {ticket.source}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm text-neutral-300 capitalize">
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            ticket.sentiment_score < 0.4 ? "bg-red-500" : 
                            ticket.sentiment_score > 0.7 ? "bg-green-500" : "bg-yellow-500"
                          )} />
                          <span className="text-sm text-neutral-400">
                            {(ticket.sentiment_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-400 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/support/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
