// ============================================
// AGENT STATE MANAGEMENT
// ============================================

import { supabase } from '@/lib/supabase';
import type {
  Signal,
  Observation,
  ReasoningResult,
  Decision,
  Incident,
  AgentAction,
  AgentState
} from './types';

// In-memory state for current session
interface AgentMemory {
  currentObservation: Observation | null;
  currentReasoning: ReasoningResult | null;
  currentDecision: Decision | null;
  activeIncidents: Map<string, Incident>;
  pendingActions: AgentAction[];
  signalBuffer: Signal[];
  lastProcessedAt: Date | null;
  isProcessing: boolean;
}

class AgentStateManager {
  private memory: AgentMemory = {
    currentObservation: null,
    currentReasoning: null,
    currentDecision: null,
    activeIncidents: new Map(),
    pendingActions: [],
    signalBuffer: [],
    lastProcessedAt: null,
    isProcessing: false,
  };

  // Get current memory state
  getMemory(): AgentMemory {
    return this.memory;
  }

  // Update observation
  setObservation(observation: Observation): void {
    this.memory.currentObservation = observation;
  }

  // Update reasoning
  setReasoning(reasoning: ReasoningResult): void {
    this.memory.currentReasoning = reasoning;
  }

  // Update decision
  setDecision(decision: Decision): void {
    this.memory.currentDecision = decision;
  }

  // Add signal to buffer
  addSignal(signal: Signal): void {
    this.memory.signalBuffer.push(signal);
    // Keep buffer size manageable
    if (this.memory.signalBuffer.length > 1000) {
      this.memory.signalBuffer = this.memory.signalBuffer.slice(-500);
    }
  }

  // Get and clear signal buffer
  flushSignals(): Signal[] {
    const signals = [...this.memory.signalBuffer];
    this.memory.signalBuffer = [];
    return signals;
  }

  // Track active incident
  trackIncident(incident: Incident): void {
    this.memory.activeIncidents.set(incident.id, incident);
  }

  // Update incident
  updateIncident(id: string, updates: Partial<Incident>): void {
    const existing = this.memory.activeIncidents.get(id);
    if (existing) {
      this.memory.activeIncidents.set(id, { ...existing, ...updates });
    }
  }

  // Remove resolved incident
  resolveIncident(id: string): void {
    this.memory.activeIncidents.delete(id);
  }

  // Add pending action
  addPendingAction(action: AgentAction): void {
    this.memory.pendingActions.push(action);
  }

  // Remove action after execution
  completeAction(actionId: string): void {
    this.memory.pendingActions = this.memory.pendingActions.filter(
      a => a.id !== actionId
    );
  }

  // Set processing state
  setProcessing(isProcessing: boolean): void {
    this.memory.isProcessing = isProcessing;
    if (!isProcessing) {
      this.memory.lastProcessedAt = new Date();
    }
  }

  // ============================================
  // PERSISTENT STATE (Database)
  // ============================================

  // Save state to database
  async persistState(key: string, value: Record<string, unknown>, expiresIn?: number): Promise<void> {
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('agent_state')
      .upsert({
        key,
        value,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error('Failed to persist state:', error);
      throw error;
    }
  }

  // Load state from database
  async loadState<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const { data, error } = await supabase
      .from('agent_state')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to load state:', error);
      throw error;
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await this.deleteState(key);
      return null;
    }

    return data.value as T;
  }

  // Delete state
  async deleteState(key: string): Promise<void> {
    const { error } = await supabase
      .from('agent_state')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Failed to delete state:', error);
      throw error;
    }
  }

  // ============================================
  // PATTERN MEMORY
  // ============================================

  // Store a detected pattern
  async storePattern(
    patternType: string,
    signature: Record<string, unknown>,
    description: string,
    rootCause?: string,
    confidence?: number
  ): Promise<string> {
    const { data, error } = await supabase
      .from('agent_patterns')
      .insert({
        pattern_type: patternType,
        pattern_signature: signature,
        description,
        associated_root_cause: rootCause,
        confidence,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  // Find similar patterns
  async findSimilarPatterns(
    patternType: string,
    limit: number = 10
  ): Promise<Array<{ id: string; signature: Record<string, unknown>; description: string; confidence: number }>> {
    const { data, error } = await supabase
      .from('agent_patterns')
      .select('id, pattern_signature, description, confidence')
      .eq('pattern_type', patternType)
      .eq('active', true)
      .order('occurrences', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      signature: p.pattern_signature as Record<string, unknown>,
      description: p.description || '',
      confidence: p.confidence || 0,
    }));
  }

  // Increment pattern occurrence
  async incrementPattern(patternId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_pattern_occurrence', {
      pattern_id: patternId,
    });

    // If RPC doesn't exist, do it manually
    if (error) {
      const { data } = await supabase
        .from('agent_patterns')
        .select('occurrences')
        .eq('id', patternId)
        .single();

      if (data) {
        await supabase
          .from('agent_patterns')
          .update({
            occurrences: (data.occurrences || 0) + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', patternId);
      }
    }
  }

  // ============================================
  // STATISTICS & METRICS
  // ============================================

  getStats() {
    return {
      activeIncidents: this.memory.activeIncidents.size,
      pendingActions: this.memory.pendingActions.length,
      bufferedSignals: this.memory.signalBuffer.length,
      isProcessing: this.memory.isProcessing,
      lastProcessedAt: this.memory.lastProcessedAt,
    };
  }

  // Reset in-memory state (for testing)
  reset(): void {
    this.memory = {
      currentObservation: null,
      currentReasoning: null,
      currentDecision: null,
      activeIncidents: new Map(),
      pendingActions: [],
      signalBuffer: [],
      lastProcessedAt: null,
      isProcessing: false,
    };
  }
}

// Singleton instance
export const agentState = new AgentStateManager();
