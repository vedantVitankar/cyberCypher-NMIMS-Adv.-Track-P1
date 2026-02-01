'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, MessageSquare, Clock, ThumbsUp, TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsPage() {
  // Mock data for charts
  const volumeData = [
    { name: 'Mon', tickets: 12 },
    { name: 'Tue', tickets: 19 },
    { name: 'Wed', tickets: 15 },
    { name: 'Thu', tickets: 25 },
    { name: 'Fri', tickets: 22 },
    { name: 'Sat', tickets: 8 },
    { name: 'Sun', tickets: 5 },
  ];

  const responseTimeData = [
    { name: 'Mon', time: 45 },
    { name: 'Tue', time: 52 },
    { name: 'Wed', time: 38 },
    { name: 'Thu', time: 65 },
    { name: 'Fri', time: 48 },
    { name: 'Sat', time: 30 },
    { name: 'Sun', time: 25 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Support Analytics</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">1,284</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">42m</div>
            <p className="text-xs text-red-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" /> +5m from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Customer Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">4.8/5.0</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +0.2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">892</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +24 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100">Ticket Volume (Last 7 Days)</CardTitle>
            <CardDescription className="text-neutral-500">Number of new tickets created per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px' }}
                    itemStyle={{ color: '#e5e5e5' }}
                    cursor={{ fill: '#262626' }}
                  />
                  <Bar dataKey="tickets" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100">Avg Response Time (Minutes)</CardTitle>
            <CardDescription className="text-neutral-500">Average time to first response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] min-h-[300px]" style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}m`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px' }}
                    itemStyle={{ color: '#e5e5e5' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={{ fill: '#3b82f6' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
