'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
  Database,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface AgentStatus {
  isRunning: boolean;
  activeIncidents: number;
  pendingActions: number;
  bufferedSignals: number;
  isProcessing: boolean;
  lastProcessedAt: string | null;
}

interface DashboardStats {
  merchants: number;
  tickets: number;
  incidents: number;
  pendingActions: number;
}

interface PendingAction {
  id: string;
  action_type: string;
  description: string;
  confidence: number;
  risk_level: string;
  created_at: string;
  incidents?: { title: string; severity: string };
}

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  affected_merchant_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ merchants: 0, tickets: 0, incidents: 0, pendingActions: 0 });
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<Record<string, unknown> | null>(null);

  // Fetch agent status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/run');
      const data = await res.json();
      setAgentStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  // Fetch pending actions
  const fetchActions = async () => {
    try {
      const res = await fetch('/api/agent/actions?status=pending');
      const data = await res.json();
      setPendingActions(data.actions || []);
      setStats(prev => ({ ...prev, pendingActions: data.actions?.length || 0 }));
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  // Run agent once
  const runAgent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      const data = await res.json();
      setLastRunResult(data);
      await fetchStatus();
      await fetchActions();
    } catch (error) {
      console.error('Failed to run agent:', error);
    }
    setIsLoading(false);
  };

  // Generate mock data
  const generateMockData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      alert(`Generated: ${data.merchants?.length || 0} merchants, ${data.tickets} tickets, ${data.apiErrors} API errors`);
    } catch (error) {
      console.error('Failed to generate mock data:', error);
    }
    setIsLoading(false);
  };

  // Simulate crisis
  const simulateCrisis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'crisis' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Crisis simulated! Run the agent to see it detect the issue.');
      } else {
        alert(data.error || 'Failed to simulate crisis');
      }
    } catch (error) {
      console.error('Failed to simulate crisis:', error);
    }
    setIsLoading(false);
  };

  // Clear data
  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all mock data?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/agent/mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      alert('Mock data cleared');
      setLastRunResult(null);
      setPendingActions([]);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
    setIsLoading(false);
  };

  // Approve action
  const approveAction = async (actionId: string) => {
    try {
      await fetch('/api/agent/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, decision: 'approve' }),
      });
      await fetchActions();
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  // Reject action
  const rejectAction = async (actionId: string) => {
    try {
      await fetch('/api/agent/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, decision: 'reject', rejection_reason: 'Manual rejection' }),
      });
      await fetchActions();
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchActions();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-gray-400">Self-Healing Support AI for E-commerce Migration</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={runAgent}
              disabled={isLoading}
              className="bg-cosmic-orange hover:bg-cosmic-orange/80"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Agent
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-deep-charcoal border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${agentStatus?.isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-2xl font-bold">
                  {agentStatus?.isProcessing ? 'Processing' : 'Ready'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-deep-charcoal border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold">{agentStatus?.activeIncidents || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-deep-charcoal border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{pendingActions.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-deep-charcoal border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Buffered Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{agentStatus?.bufferedSignals || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Controls */}
        <Card className="bg-deep-charcoal border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Demo Controls
            </CardTitle>
            <CardDescription>Generate test data and simulate scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={generateMockData}
                disabled={isLoading}
              >
                <Database className="w-4 h-4 mr-2" />
                Generate Mock Data
              </Button>
              <Button
                variant="outline"
                onClick={simulateCrisis}
                disabled={isLoading}
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Simulate Crisis
              </Button>
              <Button
                variant="outline"
                onClick={clearData}
                disabled={isLoading}
                className="border-gray-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="actions" className="space-y-4">
          <TabsList className="bg-deep-charcoal">
            <TabsTrigger value="actions">Pending Actions</TabsTrigger>
            <TabsTrigger value="results">Last Run Results</TabsTrigger>
            <TabsTrigger value="reasoning">Reasoning Chain</TabsTrigger>
          </TabsList>

          {/* Pending Actions Tab */}
          <TabsContent value="actions">
            <Card className="bg-deep-charcoal border-gray-800">
              <CardHeader>
                <CardTitle>Actions Awaiting Approval</CardTitle>
                <CardDescription>Review and approve agent-recommended actions</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No pending actions</p>
                    <p className="text-sm">Run the agent to detect issues and generate recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingActions.map((action) => (
                      <div
                        key={action.id}
                        className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getRiskColor(action.risk_level) as "destructive" | "secondary" | "outline"}>
                                {action.risk_level.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {action.action_type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="font-medium">{action.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Confidence</div>
                            <div className="text-lg font-bold">
                              {Math.round(action.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500">
                            {new Date(action.created_at).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectAction(action.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveAction(action.id)}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Last Run Results Tab */}
          <TabsContent value="results">
            <Card className="bg-deep-charcoal border-gray-800">
              <CardHeader>
                <CardTitle>Last Agent Run Results</CardTitle>
                <CardDescription>Summary of the most recent agent cycle</CardDescription>
              </CardHeader>
              <CardContent>
                {!lastRunResult ? (
                  <div className="text-center py-8 text-gray-500">
                    <Play className="w-12 h-12 mx-auto mb-3" />
                    <p>No results yet</p>
                    <p className="text-sm">Click &quot;Run Agent&quot; to start the observation cycle</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Signals Observed</div>
                        <div className="text-2xl font-bold">{(lastRunResult.data as Record<string, number>)?.signals_observed || 0}</div>
                      </div>
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Patterns Detected</div>
                        <div className="text-2xl font-bold">{(lastRunResult.data as Record<string, number>)?.patterns_detected || 0}</div>
                      </div>
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Issues Analyzed</div>
                        <div className="text-2xl font-bold">{(lastRunResult.data as Record<string, number>)?.issues_analyzed || 0}</div>
                      </div>
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Duration</div>
                        <div className="text-2xl font-bold">{(lastRunResult.data as Record<string, number>)?.duration_ms || 0}ms</div>
                      </div>
                    </div>

                    {/* Observation Summary */}
                    {lastRunResult.observation && (
                      <div>
                        <h4 className="text-lg font-semibold mb-2">Observation Summary</h4>
                        <p className="text-gray-300 bg-gray-900 p-3 rounded">
                          {(lastRunResult.observation as Record<string, string>).summary}
                        </p>
                      </div>
                    )}

                    {/* Anomalies */}
                    {(lastRunResult.observation as Record<string, Array<Record<string, string>>>)?.anomalies?.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          Anomalies Detected
                        </h4>
                        <div className="space-y-2">
                          {(lastRunResult.observation as Record<string, Array<Record<string, string>>>).anomalies.map((anomaly: Record<string, string>, i: number) => (
                            <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getSeverityColor(anomaly.severity)}>
                                  {anomaly.severity}
                                </Badge>
                                <span className="font-medium">{anomaly.type}</span>
                              </div>
                              <p className="text-sm text-gray-300">{anomaly.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reasoning Chain Tab */}
          <TabsContent value="reasoning">
            <Card className="bg-deep-charcoal border-gray-800">
              <CardHeader>
                <CardTitle>Agent Reasoning Chain</CardTitle>
                <CardDescription>Step-by-step thinking process (explainability)</CardDescription>
              </CardHeader>
              <CardContent>
                {!lastRunResult?.reasoning || (lastRunResult.reasoning as Array<Record<string, unknown>>).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3" />
                    <p>No reasoning data</p>
                    <p className="text-sm">Run the agent when there are signals to see the reasoning chain</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(lastRunResult.reasoning as Array<Record<string, unknown>>).map((result: Record<string, unknown>, idx: number) => (
                      <div key={idx} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge>{result.classification as string}</Badge>
                          <span className="text-sm text-gray-400">
                            Confidence: {Math.round((result.confidence as number) * 100)}%
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">Root Cause Hypothesis</h4>
                        <p className="text-gray-300 bg-gray-900 p-3 rounded mb-4">
                          {result.root_cause_hypothesis as string}
                        </p>
                        <h4 className="font-semibold mb-2">Evidence Chain</h4>
                        <div className="space-y-2">
                          {((result.evidence_chain as Array<Record<string, unknown>>) || []).slice(0, 5).map((evidence: Record<string, unknown>, i: number) => (
                            <div key={i} className="text-sm bg-gray-900 p-2 rounded flex items-start gap-2">
                              <span className="text-gray-500">{i + 1}.</span>
                              <div>
                                <Badge variant="outline" className="text-xs mb-1">{evidence.type as string}</Badge>
                                <p className="text-gray-300">{evidence.description as string}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
