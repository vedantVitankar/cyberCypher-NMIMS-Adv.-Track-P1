// ============================================
// AGENT ORCHESTRATOR - Main Entry Point
// ============================================

import { observer } from './observer';
import { reasoner } from './reasoner';
import { decider } from './decider';
import { actor } from './actor';
import { agentState } from './state';
import type {
  Observation,
  ReasoningResult,
  Decision,
  ExecutionResult
} from './types';

export interface AgentLoopResult {
  observation: Observation;
  reasoningResults: ReasoningResult[];
  decisions: Decision[];
  executionResults: ExecutionResult[];
  timestamp: string;
  duration_ms: number;
}

class Agent {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  // ============================================
  // MAIN AGENT LOOP
  // ============================================

  /**
   * Run one complete cycle of the agent loop:
   * Observe -> Reason -> Decide -> Act
   */
  async runOnce(): Promise<AgentLoopResult> {
    const startTime = Date.now();

    try {
      agentState.setProcessing(true);

      // STEP 1: OBSERVE
      console.log('🔍 [OBSERVE] Collecting signals...');
      const observation = await observer.observe();
      console.log(`   Found ${observation.signals.length} signals, ${observation.patterns_detected.length} patterns`);

      // If nothing significant, return early
      if (observation.signals.length === 0 && observation.anomalies.length === 0) {
        agentState.setProcessing(false);
        return {
          observation,
          reasoningResults: [],
          decisions: [],
          executionResults: [],
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      }

      // STEP 2: REASON
      console.log('🧠 [REASON] Analyzing signals...');
      const reasoningResults = await reasoner.reason(observation);
      console.log(`   Identified ${reasoningResults.length} issue cluster(s)`);

      // STEP 3: DECIDE
      console.log('⚖️ [DECIDE] Selecting actions...');
      const decisions = await decider.decide(reasoningResults);
      const totalActions = decisions.reduce((sum, d) => sum + d.recommended_actions.length, 0);
      console.log(`   Recommended ${totalActions} action(s)`);

      // STEP 4: ACT
      console.log('🎯 [ACT] Executing actions...');
      const executionResults: ExecutionResult[] = [];
      for (let i = 0; i < decisions.length; i++) {
        const decision = decisions[i];
        const reasoning = reasoningResults[i];

        const results = await actor.execute(decision, {
          merchantIds: reasoning?.affected_scope.merchants,
        });
        executionResults.push(...results);
      }

      const executed = executionResults.filter(r => r.success && r.result?.status !== 'pending_approval').length;
      const pending = executionResults.filter(r => r.result?.status === 'pending_approval').length;
      console.log(`   Executed: ${executed}, Pending approval: ${pending}`);

      agentState.setProcessing(false);

      return {
        observation,
        reasoningResults,
        decisions,
        executionResults,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      agentState.setProcessing(false);
      console.error('Agent loop error:', error);
      throw error;
    }
  }

  /**
   * Start continuous agent loop with specified interval
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log('Agent is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🤖 Agent started with ${intervalMs / 1000}s interval`);

    // Run immediately
    this.runOnce().catch(console.error);

    // Then run on interval
    this.intervalId = setInterval(() => {
      if (!agentState.getMemory().isProcessing) {
        this.runOnce().catch(console.error);
      }
    }, intervalMs);
  }

  /**
   * Stop the agent loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Agent stopped');
  }

  /**
   * Check if agent is running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      ...agentState.getStats(),
    };
  }
}

// Create singleton agent instance
export const agent = new Agent();

// Re-export components for direct access
export { observer } from './observer';
export { reasoner } from './reasoner';
export { decider } from './decider';
export { actor } from './actor';
export { agentState } from './state';

// Re-export types
export * from './types';
