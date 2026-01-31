// ============================================
// AGENT DECIDER - Action Selection
// ============================================

import { agentState } from './state';
import type {
  ReasoningResult,
  Decision,
  ActionType,
  RiskLevel,
  IncidentType
} from './types';

interface DecisionRule {
  condition: (result: ReasoningResult) => boolean;
  actions: Array<{
    type: ActionType;
    priority: number;
    riskLevel: RiskLevel;
    requiresApproval: boolean;
    descriptionTemplate: string;
  }>;
}

// Decision rules based on incident type and severity
const DECISION_RULES: DecisionRule[] = [
  // Critical platform regression - immediate escalation
  {
    condition: (r) =>
      r.classification === 'platform_regression' &&
      r.affected_scope.merchants.length >= 3,
    actions: [
      {
        type: 'escalate_engineering',
        priority: 1,
        riskLevel: 'critical',
        requiresApproval: false,
        descriptionTemplate: 'Escalate to engineering: Platform regression affecting {merchant_count} merchants',
      },
      {
        type: 'notify_merchants_batch',
        priority: 2,
        riskLevel: 'medium',
        requiresApproval: true,
        descriptionTemplate: 'Notify affected merchants about known issue and ETA',
      },
      {
        type: 'create_incident',
        priority: 3,
        riskLevel: 'low',
        requiresApproval: false,
        descriptionTemplate: 'Create incident ticket for tracking',
      },
    ],
  },

  // Payment/checkout issues - high priority
  {
    condition: (r) => r.classification === 'payment_issue',
    actions: [
      {
        type: 'escalate_engineering',
        priority: 1,
        riskLevel: 'high',
        requiresApproval: false,
        descriptionTemplate: 'Escalate payment issue to engineering for immediate investigation',
      },
      {
        type: 'notify_merchant',
        priority: 2,
        riskLevel: 'medium',
        requiresApproval: true,
        descriptionTemplate: 'Notify merchant(s) about checkout issue being investigated',
      },
    ],
  },

  // Config error - suggest fix
  {
    condition: (r) =>
      r.classification === 'config_error' &&
      r.confidence >= 0.7,
    actions: [
      {
        type: 'config_fix_suggestion',
        priority: 1,
        riskLevel: 'low',
        requiresApproval: false,
        descriptionTemplate: 'Send configuration fix suggestion to merchant',
      },
      {
        type: 'auto_reply',
        priority: 2,
        riskLevel: 'low',
        requiresApproval: false,
        descriptionTemplate: 'Auto-reply to support ticket with fix instructions',
      },
    ],
  },

  // Migration misstep - proactive guidance
  {
    condition: (r) => r.classification === 'migration_misstep',
    actions: [
      {
        type: 'notify_merchant',
        priority: 1,
        riskLevel: 'low',
        requiresApproval: true,
        descriptionTemplate: 'Send migration checklist and troubleshooting guide to merchant',
      },
      {
        type: 'escalate_support',
        priority: 2,
        riskLevel: 'low',
        requiresApproval: false,
        descriptionTemplate: 'Flag for support team follow-up',
      },
    ],
  },

  // Documentation gap - update docs
  {
    condition: (r) => r.classification === 'documentation_gap',
    actions: [
      {
        type: 'update_documentation',
        priority: 1,
        riskLevel: 'low',
        requiresApproval: true,
        descriptionTemplate: 'Suggest documentation update based on common questions',
      },
      {
        type: 'auto_reply',
        priority: 2,
        riskLevel: 'low',
        requiresApproval: false,
        descriptionTemplate: 'Auto-reply with relevant documentation links',
      },
    ],
  },

  // API outage - critical response
  {
    condition: (r) => r.classification === 'api_outage',
    actions: [
      {
        type: 'escalate_engineering',
        priority: 1,
        riskLevel: 'critical',
        requiresApproval: false,
        descriptionTemplate: 'URGENT: API outage detected - escalate immediately',
      },
      {
        type: 'apply_mitigation',
        priority: 2,
        riskLevel: 'high',
        requiresApproval: true,
        descriptionTemplate: 'Consider applying temporary mitigation (failover, circuit breaker)',
      },
      {
        type: 'notify_merchants_batch',
        priority: 3,
        riskLevel: 'medium',
        requiresApproval: true,
        descriptionTemplate: 'Send status update to all affected merchants',
      },
    ],
  },
];

// Confidence thresholds for auto-approval
const CONFIDENCE_THRESHOLDS = {
  auto_reply: 0.85,
  notify_merchant: 0.70,
  config_fix_suggestion: 0.80,
  escalate_support: 0.60,
  escalate_engineering: 0.50, // Low threshold - better to escalate
  create_incident: 0.50,
  notify_merchants_batch: 0.75,
  update_documentation: 0.70,
  apply_mitigation: 0.90,
  rollback_recommendation: 0.85,
};

class AgentDecider {
  // Main decision method
  async decide(reasoningResults: ReasoningResult[]): Promise<Decision[]> {
    const decisions: Decision[] = [];

    for (const result of reasoningResults) {
      const decision = this.makeDecision(result);
      decisions.push(decision);

      // Update agent state
      agentState.setDecision(decision);
    }

    return decisions;
  }

  private makeDecision(result: ReasoningResult): Decision {
    const recommendedActions: Decision['recommended_actions'] = [];
    const alternativesConsidered: string[] = [];

    // Find matching rules
    const matchingRules = DECISION_RULES.filter(rule => rule.condition(result));

    if (matchingRules.length === 0) {
      // Default action when no rules match
      return {
        recommended_actions: [
          {
            action_type: 'escalate_support',
            description: 'No specific action rule matched. Escalating to support for manual review.',
            confidence: result.confidence,
            risk_level: 'low',
            requires_approval: false,
            priority: 1,
            details: {
              classification: result.classification,
              reason: 'No matching decision rule',
            },
          },
        ],
        reasoning: 'Unable to determine specific action. Defaulting to support escalation for manual review.',
        alternatives_considered: ['Auto-reply', 'Engineering escalation'],
      };
    }

    // Process matching rules
    for (const rule of matchingRules) {
      for (const actionDef of rule.actions) {
        // Check if confidence meets threshold
        const threshold = CONFIDENCE_THRESHOLDS[actionDef.type] || 0.5;
        const meetsThreshold = result.confidence >= threshold;

        // Build description from template
        const description = this.buildDescription(actionDef.descriptionTemplate, result);

        // Determine if approval is required
        const requiresApproval = actionDef.requiresApproval ||
          !meetsThreshold ||
          actionDef.riskLevel === 'critical' ||
          actionDef.riskLevel === 'high';

        recommendedActions.push({
          action_type: actionDef.type,
          description,
          confidence: result.confidence,
          risk_level: actionDef.riskLevel,
          requires_approval: requiresApproval,
          priority: actionDef.priority,
          details: {
            classification: result.classification,
            affected_merchants: result.affected_scope.merchants,
            root_cause: result.root_cause_hypothesis,
            threshold_met: meetsThreshold,
            threshold_required: threshold,
          },
        });
      }
    }

    // Sort by priority
    recommendedActions.sort((a, b) => a.priority - b.priority);

    // Track alternatives
    const allActionTypes = new Set(DECISION_RULES.flatMap(r => r.actions.map(a => a.type)));
    const recommendedTypes = new Set(recommendedActions.map(a => a.action_type));
    for (const actionType of allActionTypes) {
      if (!recommendedTypes.has(actionType)) {
        alternativesConsidered.push(this.formatActionType(actionType));
      }
    }

    const reasoning = this.buildReasoning(result, recommendedActions);

    return {
      recommended_actions: recommendedActions,
      reasoning,
      alternatives_considered: alternativesConsidered.slice(0, 5),
    };
  }

  private buildDescription(template: string, result: ReasoningResult): string {
    return template
      .replace('{merchant_count}', String(result.affected_scope.merchants.length))
      .replace('{classification}', result.classification)
      .replace('{confidence}', `${Math.round(result.confidence * 100)}%`)
      .replace('{features}', result.affected_scope.features.join(', '));
  }

  private buildReasoning(
    result: ReasoningResult,
    actions: Decision['recommended_actions']
  ): string {
    const parts: string[] = [];

    parts.push(`Classified as ${result.classification} with ${Math.round(result.confidence * 100)}% confidence.`);
    parts.push(`Root cause: ${result.root_cause_hypothesis}`);

    if (result.affected_scope.merchants.length > 0) {
      parts.push(`Affecting ${result.affected_scope.merchants.length} merchant(s).`);
    }

    const autoApproved = actions.filter(a => !a.requires_approval);
    const needsApproval = actions.filter(a => a.requires_approval);

    if (autoApproved.length > 0) {
      parts.push(`${autoApproved.length} action(s) can be auto-executed.`);
    }
    if (needsApproval.length > 0) {
      parts.push(`${needsApproval.length} action(s) require human approval.`);
    }

    return parts.join(' ');
  }

  private formatActionType(actionType: ActionType): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ============================================
  // APPROVAL EVALUATION
  // ============================================

  evaluateForAutoApproval(
    actionType: ActionType,
    confidence: number,
    riskLevel: RiskLevel
  ): { approved: boolean; reason: string } {
    // Never auto-approve critical or high risk actions
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return {
        approved: false,
        reason: `${riskLevel} risk level requires human approval`,
      };
    }

    const threshold = CONFIDENCE_THRESHOLDS[actionType] || 0.5;

    if (confidence < threshold) {
      return {
        approved: false,
        reason: `Confidence ${Math.round(confidence * 100)}% below threshold ${Math.round(threshold * 100)}%`,
      };
    }

    // Actions that always need approval
    const alwaysNeedsApproval: ActionType[] = [
      'apply_mitigation',
      'rollback_recommendation',
      'notify_merchants_batch',
    ];

    if (alwaysNeedsApproval.includes(actionType)) {
      return {
        approved: false,
        reason: `${this.formatActionType(actionType)} always requires human approval`,
      };
    }

    return {
      approved: true,
      reason: `Auto-approved: confidence ${Math.round(confidence * 100)}% meets threshold`,
    };
  }
}

// Export singleton instance
export const decider = new AgentDecider();

// Export for custom configuration
export { AgentDecider };
