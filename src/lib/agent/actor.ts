// ============================================
// AGENT ACTOR - Action Execution
// ============================================

import { supabase } from '@/lib/supabase';
import { agentState } from './state';
import type {
  Decision,
  AgentAction,
  ExecutionResult,
  ActionType,
  Incident,
  IncidentType
} from './types';

interface ActionHandler {
  execute: (action: AgentAction, context: ActionContext) => Promise<ExecutionResult>;
  rollback?: (action: AgentAction, result: ExecutionResult) => Promise<void>;
}

interface ActionContext {
  incident?: Incident;
  merchantIds?: string[];
  ticketId?: string;
}

class AgentActor {
  private handlers: Map<ActionType, ActionHandler> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  // ============================================
  // ACTION EXECUTION
  // ============================================

  async execute(
    decision: Decision,
    context: ActionContext = {}
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const actionDef of decision.recommended_actions) {
      // Create action record
      const action = await this.createAction(actionDef, context);

      // Check if approval is needed
      if (actionDef.requires_approval) {
        // Add to pending queue
        agentState.addPendingAction(action);
        results.push({
          action_id: action.id,
          success: true,
          result: { status: 'pending_approval' },
          error: null,
          side_effects: [],
          rollback_available: false,
        });
        continue;
      }

      // Execute the action
      const result = await this.executeAction(action, context);
      results.push(result);
    }

    return results;
  }

  async executeAction(action: AgentAction, context: ActionContext): Promise<ExecutionResult> {
    const handler = this.handlers.get(action.action_type);

    if (!handler) {
      return {
        action_id: action.id,
        success: false,
        result: null,
        error: `No handler registered for action type: ${action.action_type}`,
        side_effects: [],
        rollback_available: false,
      };
    }

    try {
      const result = await handler.execute(action, context);

      // Update action record
      await this.updateActionResult(action.id, result);

      // Remove from pending if it was there
      agentState.completeAction(action.id);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: ExecutionResult = {
        action_id: action.id,
        success: false,
        result: null,
        error: errorMessage,
        side_effects: [],
        rollback_available: false,
      };

      await this.updateActionResult(action.id, result);

      return result;
    }
  }

  // ============================================
  // APPROVAL WORKFLOW
  // ============================================

  async approveAction(actionId: string, approvedBy: string): Promise<ExecutionResult> {
    // Get the action
    const { data: action, error } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (error || !action) {
      return {
        action_id: actionId,
        success: false,
        result: null,
        error: 'Action not found',
        side_effects: [],
        rollback_available: false,
      };
    }

    // Update approval status
    await supabase
      .from('agent_actions')
      .update({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    // Execute the action
    return await this.executeAction(action as AgentAction, {});
  }

  async rejectAction(actionId: string, rejectedBy: string, reason: string): Promise<void> {
    await supabase
      .from('agent_actions')
      .update({
        approval_status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', actionId);

    agentState.completeAction(actionId);
  }

  // ============================================
  // ACTION HANDLERS
  // ============================================

  private registerDefaultHandlers() {
    // Auto-reply handler
    this.handlers.set('auto_reply', {
      execute: async (action, context) => {
        const details = action.details as { response?: string; ticketId?: string } | null;

        if (context.ticketId || details?.ticketId) {
          const ticketId = context.ticketId || details?.ticketId;

          await supabase
            .from('support_tickets')
            .update({
              agent_response: details?.response || action.description,
              agent_confidence: action.confidence,
              status: 'in_progress',
            })
            .eq('id', ticketId);
        }

        return {
          action_id: action.id,
          success: true,
          result: { message: 'Auto-reply sent' },
          error: null,
          side_effects: ['Ticket status updated to in_progress'],
          rollback_available: false,
        };
      },
    });

    // Escalate to engineering
    this.handlers.set('escalate_engineering', {
      execute: async (action) => {
        // In production, this would integrate with PagerDuty, Slack, etc.
        console.log('🚨 ENGINEERING ESCALATION:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Escalated to engineering',
            channel: 'engineering-alerts',
          },
          error: null,
          side_effects: ['Notification sent to engineering channel'],
          rollback_available: false,
        };
      },
    });

    // Escalate to support
    this.handlers.set('escalate_support', {
      execute: async (action) => {
        console.log('📞 SUPPORT ESCALATION:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Escalated to support team',
            priority: action.details?.priority || 'medium',
          },
          error: null,
          side_effects: ['Added to support queue'],
          rollback_available: false,
        };
      },
    });

    // Notify merchant
    this.handlers.set('notify_merchant', {
      execute: async (action, context) => {
        const merchantIds = context.merchantIds ||
          (action.details as { affected_merchants?: string[] })?.affected_merchants || [];

        // In production, this would send emails/notifications
        console.log('📧 MERCHANT NOTIFICATION:', merchantIds, action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Notification sent',
            merchants_notified: merchantIds.length,
          },
          error: null,
          side_effects: [`Notified ${merchantIds.length} merchant(s)`],
          rollback_available: false,
        };
      },
    });

    // Notify merchants batch
    this.handlers.set('notify_merchants_batch', {
      execute: async (action, context) => {
        const merchantIds = context.merchantIds ||
          (action.details as { affected_merchants?: string[] })?.affected_merchants || [];

        console.log('📧 BATCH MERCHANT NOTIFICATION:', merchantIds.length, 'merchants');

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Batch notification sent',
            merchants_notified: merchantIds.length,
          },
          error: null,
          side_effects: [`Batch notified ${merchantIds.length} merchant(s)`],
          rollback_available: false,
        };
      },
    });

    // Create incident
    this.handlers.set('create_incident', {
      execute: async (action) => {
        const details = action.details as {
          classification?: IncidentType;
          affected_merchants?: string[];
          root_cause?: string;
        } | null;

        const { data: incident, error } = await supabase
          .from('incidents')
          .insert({
            title: action.description,
            type: details?.classification || 'config_error',
            severity: action.risk_level === 'critical' ? 'critical' :
              action.risk_level === 'high' ? 'high' : 'medium',
            affected_merchants: details?.affected_merchants || [],
            root_cause: details?.root_cause,
            root_cause_confidence: action.confidence,
            status: 'detected',
          })
          .select('id')
          .single();

        if (error) throw error;

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Incident created',
            incident_id: incident?.id,
          },
          error: null,
          side_effects: ['New incident created for tracking'],
          rollback_available: true,
        };
      },
    });

    // Config fix suggestion
    this.handlers.set('config_fix_suggestion', {
      execute: async (action, context) => {
        const merchantIds = context.merchantIds ||
          (action.details as { affected_merchants?: string[] })?.affected_merchants || [];

        console.log('🔧 CONFIG FIX SUGGESTION:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Configuration fix suggestion sent',
            suggestion: action.description,
          },
          error: null,
          side_effects: [`Sent fix suggestion to ${merchantIds.length} merchant(s)`],
          rollback_available: false,
        };
      },
    });

    // Update documentation
    this.handlers.set('update_documentation', {
      execute: async (action) => {
        // In production, this would create a PR or Jira ticket
        console.log('📝 DOCUMENTATION UPDATE REQUESTED:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Documentation update task created',
          },
          error: null,
          side_effects: ['Documentation task added to backlog'],
          rollback_available: false,
        };
      },
    });

    // Apply mitigation
    this.handlers.set('apply_mitigation', {
      execute: async (action) => {
        // This is a high-risk action - would need actual implementation
        console.log('⚠️ MITIGATION APPLIED:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Mitigation applied',
            mitigation_type: 'temporary',
          },
          error: null,
          side_effects: ['Temporary mitigation in place'],
          rollback_available: true,
        };
      },
      rollback: async (action) => {
        console.log('↩️ MITIGATION ROLLED BACK:', action.description);
      },
    });

    // Rollback recommendation
    this.handlers.set('rollback_recommendation', {
      execute: async (action) => {
        console.log('🔄 ROLLBACK RECOMMENDED:', action.description);

        return {
          action_id: action.id,
          success: true,
          result: {
            message: 'Rollback recommendation created',
          },
          error: null,
          side_effects: ['Rollback recommendation sent to engineering'],
          rollback_available: false,
        };
      },
    });
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  private async createAction(
    actionDef: Decision['recommended_actions'][0],
    context: ActionContext
  ): Promise<AgentAction> {
    const action: Omit<AgentAction, 'id' | 'created_at'> = {
      incident_id: context.incident?.id || null,
      ticket_id: context.ticketId || null,
      action_type: actionDef.action_type,
      description: actionDef.description,
      details: actionDef.details,
      confidence: actionDef.confidence,
      risk_level: actionDef.risk_level,
      requires_approval: actionDef.requires_approval,
      approval_status: actionDef.requires_approval ? 'pending' : 'auto_approved',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      executed: false,
      executed_at: null,
      execution_result: null,
    };

    const { data, error } = await supabase
      .from('agent_actions')
      .insert(action)
      .select()
      .single();

    if (error) throw error;

    return data as AgentAction;
  }

  private async updateActionResult(actionId: string, result: ExecutionResult): Promise<void> {
    await supabase
      .from('agent_actions')
      .update({
        executed: result.success,
        executed_at: new Date().toISOString(),
        execution_result: result,
      })
      .eq('id', actionId);
  }

  // ============================================
  // CUSTOM HANDLER REGISTRATION
  // ============================================

  registerHandler(actionType: ActionType, handler: ActionHandler): void {
    this.handlers.set(actionType, handler);
  }
}

// Export singleton instance
export const actor = new AgentActor();

// Export for custom configuration
export { AgentActor };
