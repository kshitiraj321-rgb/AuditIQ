import { 
  IExceptionLifecycleManager, 
  IPolicyEngine, 
  IExceptionRepository 
} from '../interfaces/exceptionInterfaces';
import { 
  ExceptionState, 
  PolicyEvaluationContext, 
  LegalStateTransitions,
  ExceptionStatus,
  AuditLogEntry
} from '../types/exceptionLifecycle';
import { DetectedException } from '../exceptionEngine';
import { TransactionState } from '../types/continuous';

export class ExceptionLifecycleManager implements IExceptionLifecycleManager {
  constructor(
    private readonly policyEngine: IPolicyEngine,
    private readonly repository: IExceptionRepository
  ) {}

  public async handleDetectedExceptions(exceptions: DetectedException[], transactionState: TransactionState): Promise<ExceptionState[]> {
    if (exceptions.length === 0) {
      return [];
    }

    // Idempotency check: if exceptions already exist for this transaction, abort processing safely.
    const existingExceptions = await this.repository.getByTransactionId(transactionState.transactionId);
    if (existingExceptions && existingExceptions.length > 0) {
      // Safely terminate without mutating state.
      return existingExceptions;
    }

    const processedExceptions: ExceptionState[] = [];

    for (const ex of exceptions) {
      const exceptionId = `EXC-${transactionState.transactionId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const creationLog: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        action: 'CREATED',
        actor: 'SYSTEM',
        reason: 'Detected by V1 exception engine'
      };

      const initialState: ExceptionState = {
        id: exceptionId,
        transactionId: transactionState.transactionId,
        type: ex.type,
        status: 'OPEN',
        auditTrail: [creationLog],
        severity: ex.severity,
        message: ex.message,
        metadata: {}
      };

      // Persist the initial state before policy evaluation
      await this.repository.save(initialState);
      await this.repository.appendAuditLog(initialState.id, creationLog);

      const context: Omit<PolicyEvaluationContext, 'exceptionState'> = {
        transactionState,
        currentTimestamp: new Date().toISOString(),
        repositoryPolicyVersion: '1.0.0'
      };

      // Proceed to lifecycle processing
      const processedState = await this.processException(initialState, context);
      processedExceptions.push(processedState);
    }

    return processedExceptions;
  }

  public async processException(
    exceptionState: ExceptionState, 
    context: Omit<PolicyEvaluationContext, 'exceptionState'>
  ): Promise<ExceptionState> {
    const fullContext: PolicyEvaluationContext = {
      ...context,
      exceptionState
    };

    // 1. Evaluate policies
    const evaluationResult = this.policyEngine.evaluateAll(fullContext);
    const { winningDecision } = evaluationResult;

    // 2. Map PolicyDecisionType to ExceptionStatus
    const targetStatus = this.mapDecisionToStatus(winningDecision.decision);

    // 3. Validate state transition
    if (!this.isValidTransition(exceptionState.status, targetStatus)) {
      // Reject illegal transition. We could throw, or log and maintain current state.
      // Here we log to the audit trail and reject the state change.
      const rejectionLog: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        action: 'TRANSITION_REJECTED',
        actor: 'LIFECYCLE_MANAGER',
        reason: `Illegal state transition attempted from ${exceptionState.status} to ${targetStatus}`,
        policyId: winningDecision.policyId,
        policyVersion: winningDecision.policyVersion
      };

      await this.repository.appendAuditLog(exceptionState.id, rejectionLog);
      return exceptionState;
    }

    // If there is no state change requested, we just return the state (e.g. WAIT or IGNORE if already IGNORED).
    if (exceptionState.status === targetStatus) {
      return exceptionState;
    }

    // 4. Apply State Mutation
    const originalStatus = exceptionState.status;
    exceptionState.status = targetStatus;

    // Build the audit log for the successful transition
    const transitionLog: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action: `TRANSITION_TO_${targetStatus}`,
      actor: 'POLICY_ENGINE',
      reason: winningDecision.reason,
      policyId: winningDecision.policyId,
      policyVersion: winningDecision.policyVersion
    };

    exceptionState.auditTrail.push(transitionLog);

    // 5. Persist State Exclusively through Repository
    try {
      await this.repository.save(exceptionState);
      // Wait to append audit log independently or as part of the transaction depending on implementation
      await this.repository.appendAuditLog(exceptionState.id, transitionLog);
    } catch (error) {
      // Persistence Failure: Do not advance beyond last confirmed state.
      // Revert the in-memory mutation so caller gets the original state back.
      exceptionState.status = originalStatus;
      exceptionState.auditTrail.pop(); // Remove the unsaved log entry
      
      // Surface the error for operational intervention without modifying the transaction
      throw new Error(`Failed to persist exception state transition for ${exceptionState.id}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return exceptionState;
  }

  private isValidTransition(current: ExceptionStatus, target: ExceptionStatus): boolean {
    if (current === target) return true; // Self-transitions or no-ops are fine
    const allowed = LegalStateTransitions[current] || [];
    return allowed.includes(target);
  }

  private mapDecisionToStatus(decision: string): ExceptionStatus {
    switch (decision) {
      case 'RESOLVE': return 'RESOLVED';
      case 'ESCALATE': return 'ESCALATED';
      case 'MANUAL_REVIEW': return 'UNDER_REVIEW';
      case 'IGNORE': return 'IGNORED';
      case 'FLAG': return 'FLAGGED';
      case 'WAIT': return 'OPEN'; // WAIT keeps it in OPEN state, just defers resolution
      default: return 'UNDER_REVIEW'; // Safe fallback
    }
  }
}
