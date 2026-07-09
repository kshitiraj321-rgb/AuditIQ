import { IngestionPayload, TransactionState } from '../types/continuous';

/**
 * TransactionStagingService is responsible for aggregating partial procurement
 * documents into a canonical transaction state before deterministic analysis.
 *
 * It acts strictly as an operational boundary. It does NOT perform business
 * validation, three-way matching, or financial risk calculations.
 */
export class TransactionStagingService {
  /**
   * Aggregates an incoming payload into the existing transaction state.
   * Modifies the state in-place and evaluates structural readiness.
   * 
   * @param state The current canonical transaction state
   * @param payload The incoming ingestion payload
   * @returns boolean True if the state transitioned to 'READY' during this operation
   */
  public stagePayload(state: TransactionState, payload: IngestionPayload): boolean {
    // 1. Assign payload based on structural type
    switch (payload.payloadType) {
      case 'PURCHASE_ORDER':
        state.purchaseOrderPayload = payload;
        break;
      case 'GOODS_RECEIPT':
        state.goodsReceiptPayload = payload;
        break;
      case 'INVOICE':
        state.invoicePayload = payload;
        break;
      case 'FINANCIAL_RECORD':
        // Financial records do not block the canonical 3-way match
        break;
    }

    // 2. Track idempotency keys for distributed deduplication
    if (!state.idempotencyKeys.includes(payload.idempotencyKey)) {
      state.idempotencyKeys.push(payload.idempotencyKey);
    }
    
    state.lastUpdated = new Date().toISOString();

    // 3. Evaluate Structural Readiness (Transaction Staging Boundary)
    // Strictly structural. Business logic (matching quantities, amounts, dates)
    // is expressly forbidden at this layer.
    const isReady = !!(
      state.purchaseOrderPayload &&
      state.goodsReceiptPayload &&
      state.invoicePayload
    );

    // Only transition if currently PENDING
    if (isReady && state.status === 'PENDING') {
      state.status = 'READY';
      return true; // Indicates the state has just achieved readiness
    }

    return false;
  }
}
