import { IPolicyEngine, IAutonomousResolutionPolicy } from '../interfaces/exceptionInterfaces';
import { PolicyEvaluationContext, PolicyEvaluationResult, PolicyDecision, EvaluationTrace } from '../types/exceptionLifecycle';

export class PolicyEngine implements IPolicyEngine {
  private readonly policies: ReadonlyArray<IAutonomousResolutionPolicy>;

  constructor(policies: IAutonomousResolutionPolicy[]) {
    // Immutable registration of policies, deterministically sorted by priority DESC, then ID ASC
    const sortedPolicies = [...policies].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.id.localeCompare(b.id);
    });
    this.policies = Object.freeze(sortedPolicies);
  }

  public evaluateAll(context: PolicyEvaluationContext): PolicyEvaluationResult {
    if (this.policies.length === 0) {
      return this.createFallbackResult();
    }

    const decisions: PolicyDecision[] = [];
    const evaluatedPolicies: string[] = [];
    const evaluationTrace: EvaluationTrace[] = [];

    let executionOrder = 1;
    for (const policy of this.policies) {
      const decision = policy.evaluate(context);
      decisions.push(decision);
      evaluatedPolicies.push(policy.id);
      
      evaluationTrace.push({
        policyId: policy.id,
        policyVersion: policy.version,
        priority: policy.priority,
        executionOrder: executionOrder++,
        returnedDecision: decision.decision
      });
    }

    return this.resolveConflicts(decisions, evaluatedPolicies, evaluationTrace);
  }

  private resolveConflicts(
    decisions: PolicyDecision[], 
    evaluatedPolicies: string[],
    evaluationTrace: EvaluationTrace[]
  ): PolicyEvaluationResult {
    // The policies are already sorted deterministically (priority DESC, policyId ASC).
    // Therefore, decisions are also ordered.
    
    // Map decisions back to priority
    const decisionsWithPriority = decisions.map(d => {
      const trace = evaluationTrace.find(t => t.policyId === d.policyId);
      return {
        decision: d,
        priority: trace ? trace.priority : 0
      };
    });

    const topCandidate = decisionsWithPriority[0];
    
    // Check for conflicting decisions at the same highest priority level
    const samePriorityDecisions = decisionsWithPriority.filter(d => d.priority === topCandidate.priority);
    const conflicting = samePriorityDecisions.some(d => d.decision.decision !== topCandidate.decision.decision);

    if (conflicting) {
      return {
        winningDecision: {
          decision: 'MANUAL_REVIEW',
          reason: 'Conflicting policies at highest priority level. Safe fallback triggered.',
          policyId: 'SYSTEM_CONFLICT_RESOLVER',
          policyVersion: '1.0',
        },
        winningPolicy: 'SYSTEM_CONFLICT_RESOLVER',
        evaluatedPolicies,
        conflictDetected: true,
        reasoningMetadata: { tiedPolicies: samePriorityDecisions.map(d => d.decision.policyId) },
        evaluationTrace
      };
    }

    return {
      winningDecision: topCandidate.decision,
      winningPolicy: topCandidate.decision.policyId,
      evaluatedPolicies,
      conflictDetected: false,
      evaluationTrace
    };
  }

  private createFallbackResult(): PolicyEvaluationResult {
    return {
      winningDecision: {
        decision: 'MANUAL_REVIEW',
        reason: 'No policies registered. Safe fallback triggered.',
        policyId: 'SYSTEM_FALLBACK',
        policyVersion: '1.0',
      },
      winningPolicy: 'SYSTEM_FALLBACK',
      evaluatedPolicies: [],
      conflictDetected: false,
      evaluationTrace: []
    };
  }
}
