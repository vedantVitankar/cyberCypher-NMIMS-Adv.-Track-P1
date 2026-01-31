// Agent Run API - Trigger one agent loop cycle
import { NextResponse } from 'next/server';
import { agent } from '@/lib/agent';

export async function POST() {
  try {
    const result = await agent.runOnce();

    return NextResponse.json({
      success: true,
      data: {
        signals_observed: result.observation.signals.length,
        patterns_detected: result.observation.patterns_detected.length,
        anomalies_found: result.observation.anomalies.length,
        issues_analyzed: result.reasoningResults.length,
        actions_recommended: result.decisions.reduce(
          (sum, d) => sum + d.recommended_actions.length, 0
        ),
        actions_executed: result.executionResults.filter(r => r.success).length,
        actions_pending: result.executionResults.filter(
          r => r.result?.status === 'pending_approval'
        ).length,
        duration_ms: result.duration_ms,
        timestamp: result.timestamp,
      },
      observation: result.observation,
      reasoning: result.reasoningResults,
      decisions: result.decisions,
      executions: result.executionResults,
    });
  } catch (error) {
    console.error('Agent run error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: agent.getStatus(),
  });
}
