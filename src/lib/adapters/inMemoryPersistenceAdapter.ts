import { TransactionState, IdempotencyKey } from '../types/continuous';
import { IPersistenceAdapter } from '../interfaces/continuousInterfaces';

/**
 * InMemoryPersistenceAdapter serves as the reference implementation for
 * the continuous monitoring operational state storage.
 * 
 * It strictly adheres to technology independence by simulating persistence 
 * in memory. In an enterprise deployment, this adapter would be replaced 
 * by a technology-specific implementation (e.g., PostgreSQL, Redis, DynamoDB).
 * 
 * Rules Enforced:
 * - Persists ONLY operational workflow state
 * - NEVER persists deterministic business decisions
 * - NEVER calculates readiness or performs matching
 */
export class InMemoryPersistenceAdapter implements IPersistenceAdapter {
  // Simulating a transactional document store for staging
  private transactionStore = new Map<string, TransactionState>();
  
  // Simulating an idempotency key-value store (e.g., Redis)
  private idempotencyStore = new Set<IdempotencyKey>();

  public async saveTransactionState(state: TransactionState): Promise<void> {
    // Deep copy to prevent memory reference leakage, simulating true serialization
    const serializedState = JSON.stringify(state);
    this.transactionStore.set(state.transactionId, JSON.parse(serializedState));
  }

  public async getTransactionState(transactionId: string): Promise<TransactionState | null> {
    const state = this.transactionStore.get(transactionId);
    
    if (!state) {
      return null;
    }
    
    // Deep copy to simulate deserialization from an external datastore
    return JSON.parse(JSON.stringify(state));
  }

  public async checkIdempotency(key: IdempotencyKey): Promise<boolean> {
    return this.idempotencyStore.has(key);
  }

  public async markIdempotency(key: IdempotencyKey): Promise<void> {
    this.idempotencyStore.add(key);
  }
}
