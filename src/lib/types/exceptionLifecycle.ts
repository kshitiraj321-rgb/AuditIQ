import { TransactionState } from './continuous';
import { DetectedException } from '../exceptionEngine';

export type ExceptionStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'IGNORED' | 'FLAGGED';

export type ExceptionAction = 
  | 'CREATED' 
  | 'POLICY_EVALUATED' 
  | 'MANUAL_REVIEW_REQUESTED' 
  | 'ESCALATED_TO_INVESTIGATION' 
  | 'AUTO_RESOLVED' 
  | 'MANUALLY_RESOLVED';

export interface AuditLogEntry {
  timestamp: string;
  action: ExceptionAction | string;
  actor: string; // e.g., 'SYSTEM', 'POLICY_ENGINE', 'user-id'
  reason: string;
  policyId?: string;
  policyVersion?: string;
}

export type AuditSessionStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface IAuditSession {
  id: string;
  timestamp: string;
  analysisVersion: string;
  persistenceVersion: string;
  status: AuditSessionStatus;
  inputFingerprint?: string;
  metadata?: Record<string, any>;
}

export interface ExceptionState {
  id: string;
  auditSessionId: string;
  transactionId: string;
  type: DetectedException['type'];
  status: ExceptionStatus;
  auditTrail: AuditLogEntry[];
  severity: DetectedException['severity'];
  message?: string;
  metadata?: Record<string, any>;
}

export type PolicyDecisionType = 'RESOLVE' | 'ESCALATE' | 'MANUAL_REVIEW' | 'IGNORE' | 'FLAG' | 'WAIT';

export interface PolicyDecision {
  decision: PolicyDecisionType;
  reason: string;
  policyId: string;
  policyVersion: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface PolicyEvaluationContext {
  exceptionState: ExceptionState;
  transactionState: TransactionState;
  predictiveAssessment?: any; // To be typed precisely when V3 integrations occur
  currentTimestamp: string;
  repositoryPolicyVersion: string;
}

export interface EvaluationTrace {
  policyId: string;
  policyVersion: string;
  priority: number;
  executionOrder: number;
  returnedDecision: PolicyDecisionType;
}

export interface PolicyEvaluationResult {
  winningDecision: PolicyDecision;
  winningPolicy: string;
  evaluatedPolicies: string[];
  conflictDetected: boolean;
  reasoningMetadata?: Record<string, any>;
  evaluationTrace: EvaluationTrace[];
}

// Legal State Transition Table expressed as a map for validation
export const LegalStateTransitions: Record<ExceptionStatus, ExceptionStatus[]> = {
  'OPEN': ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'IGNORED', 'FLAGGED'],
  'UNDER_REVIEW': ['ESCALATED', 'RESOLVED', 'IGNORED', 'FLAGGED'],
  'ESCALATED': ['UNDER_REVIEW', 'RESOLVED'],
  'FLAGGED': ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'IGNORED'],
  'RESOLVED': [], // Terminal
  'IGNORED': []   // Terminal
};
