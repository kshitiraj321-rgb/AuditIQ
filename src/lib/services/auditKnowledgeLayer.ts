import { AuditResult, ExceptionResolution } from '../types/index';

/**
 * Stores institutional engineering knowledge and audit history.
 * Implementation for Blueprint V4 Section 14.7 (Audit Knowledge Layer).
 */
export interface KnowledgeRecord {
  id: string;
  type: 'AUDIT_COMPLETION' | 'EXCEPTION_RESOLUTION' | 'POLICY_DECISION';
  timestamp: string;
  metadata: Record<string, unknown>;
  payload: unknown;
}

export class AuditKnowledgeLayer {
  private memoryStore: Map<string, KnowledgeRecord> = new Map();

  /**
   * Persists a completed audit into the institutional memory.
   */
  public logAudit(auditResult: AuditResult): void {
    const record: KnowledgeRecord = {
      id: `ak-audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'AUDIT_COMPLETION',
      timestamp: new Date().toISOString(),
      metadata: { transactionId: auditResult.transactionId },
      payload: auditResult
    };
    this.memoryStore.set(record.id, record);
  }

  /**
   * Persists an exception resolution.
   */
  public logResolution(resolution: ExceptionResolution): void {
    const record: KnowledgeRecord = {
      id: `ak-res-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'EXCEPTION_RESOLUTION',
      timestamp: new Date().toISOString(),
      metadata: { 
        transactionId: resolution.transactionId,
        exceptionId: resolution.exceptionId,
        resolutionType: resolution.resolutionType
      },
      payload: resolution
    };
    this.memoryStore.set(record.id, record);
  }

  /**
   * Retrieves historical records for predictive engines to learn from.
   */
  public queryHistory(filter: { type?: string; transactionId?: string }): KnowledgeRecord[] {
    const results: KnowledgeRecord[] = [];
    for (const record of this.memoryStore.values()) {
      let matches = true;
      if (filter.type && record.type !== filter.type) matches = false;
      if (filter.transactionId && record.metadata.transactionId !== filter.transactionId) matches = false;
      if (matches) results.push(record);
    }
    return results;
  }
}
