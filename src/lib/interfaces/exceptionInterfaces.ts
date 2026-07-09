import { 
  ExceptionState, 
  PolicyEvaluationContext, 
  PolicyDecision, 
  PolicyEvaluationResult,
  AuditLogEntry
} from '../types/exceptionLifecycle';

/**
 * Pure functional policy that returns a deterministic decision based on an immutable context.
 */
export interface IAutonomousResolutionPolicy {
  readonly id: string;
  readonly version: string;
  readonly priority: number; // Higher number indicates higher priority for conflict resolution
  evaluate(context: PolicyEvaluationContext): PolicyDecision;
}

/**
 * Immutable registry and execution engine for evaluating policies.
 * Resolves conflicts deterministically without mutating state.
 */
export interface IPolicyEngine {
  evaluateAll(context: PolicyEvaluationContext): PolicyEvaluationResult;
}

/**
 * Repository abstraction for persisting Exception state independently from Transactions.
 */
export interface IExceptionRepository {
  save(state: ExceptionState): Promise<void>;
  getById(id: string): Promise<ExceptionState | null>;
  getByTransactionId(transactionId: string): Promise<ExceptionState[]>;
  appendAuditLog(exceptionId: string, log: AuditLogEntry): Promise<void>;
}

import { TransactionState } from '../types/continuous';
import { DetectedException } from '../exceptionEngine';

/**
 * Orchestrates the application of policy decisions and enforces state transitions.
 * Does not implement business rules directly.
 */
export interface IExceptionLifecycleManager {
  processException(exceptionState: ExceptionState, context: Omit<PolicyEvaluationContext, 'exceptionState'>): Promise<ExceptionState>;
  handleDetectedExceptions(exceptions: DetectedException[], transactionState: TransactionState): Promise<ExceptionState[]>;
}
