import { IngestionPayload, TransactionState, IdempotencyKey } from '../types/continuous';

/**
 * Contract for normalizing incoming external streams (HTTP, Kafka, etc.)
 * into canonical AuditIQ data structures.
 */
export interface IIngestionAdapter {
  receiveEvent(rawPayload: unknown): Promise<IngestionPayload>;
}

/**
 * Contract for abstracting database/storage operations for the 
 * continuous monitoring pipeline, ensuring technology independence.
 */
export interface IPersistenceAdapter {
  saveTransactionState(state: TransactionState): Promise<void>;
  getTransactionState(transactionId: string): Promise<TransactionState | null>;
  checkIdempotency(key: IdempotencyKey): Promise<boolean>;
  markIdempotency(key: IdempotencyKey): Promise<void>;
}

/**
 * Contract for orchestrating the flow between ingestion, 
 * persistence, and the frozen deterministic/predictive engines.
 */
export interface IEventOrchestrator {
  processIncomingEvent(payload: IngestionPayload): Promise<void>;
  triggerIntelligencePipeline(transactionId: string): Promise<void>;
}
