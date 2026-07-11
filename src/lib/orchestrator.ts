import { IngestionPayload, TransactionState } from './types/continuous';
import { IPersistenceAdapter, IEventOrchestrator } from './interfaces/continuousInterfaces';
import { IExceptionLifecycleManager } from './interfaces/exceptionInterfaces';
import { TransactionStagingService } from './services/transactionStagingService';
import { matchDocuments } from './matcher';
import { detectExceptions } from './exceptionEngine';

/**
 * ContinuousOrchestrator coordinates the asynchronous staging of transactional streams.
 * It strictly delegates all business decisions to the deterministic engines,
 * acting solely as an operational state machine.
 */
export class ContinuousOrchestrator implements IEventOrchestrator {
  constructor(
    private persistenceAdapter: IPersistenceAdapter,
    private stagingService: TransactionStagingService,
    private exceptionLifecycleManager: IExceptionLifecycleManager
  ) {}

  public async processIncomingEvent(payload: IngestionPayload): Promise<void> {
    // 1. Idempotency Boundary (ADR Refinement)
    const isDuplicate = await this.persistenceAdapter.checkIdempotency(payload.idempotencyKey);
    if (isDuplicate) {
      return; // Gracefully drop duplicates to prevent compounding financial exposure
    }

    // Extract canonical grouping ID (defaults to documentNumber for isolated tracking)
    const transactionId = String(payload.data.transactionId || payload.data.documentNumber || `tx-${payload.timestamp}`);
    
    // 2. Transaction Staging (ADR Refinement)
    let state = await this.persistenceAdapter.getTransactionState(transactionId);
    if (!state) {
      state = {
        transactionId,
        status: 'PENDING',
        lastUpdated: new Date().toISOString(),
        idempotencyKeys: [],
      };
    }

    // Delegate staging and readiness evaluation to the Transaction Staging Service
    const justBecameReady = this.stagingService.stagePayload(state, payload);

    // Persist the unified state and mark idempotency transactionally
    await this.persistenceAdapter.saveTransactionState(state);
    await this.persistenceAdapter.markIdempotency(payload.idempotencyKey);

    // 4. Trigger Intelligence Pipeline if ready
    if (state.status === 'READY') {
      await this.triggerIntelligencePipeline(transactionId);
    }
  }

  public async triggerIntelligencePipeline(transactionId: string): Promise<void> {
    const state = await this.persistenceAdapter.getTransactionState(transactionId);
    
    if (!state || state.status !== 'READY') {
      return; // Failsafe: Cannot process non-ready transactions
    }

    try {
      // At this boundary, the completely staged `TransactionState` is passed
      // to the frozen V1/V3 intelligence engines.
      
      const purchaseOrderData = state.purchaseOrderPayload?.data as any || null;
      const goodsReceiptData = state.goodsReceiptPayload?.data as any || null;
      const vendorInvoiceData = state.invoicePayload?.data as any || null;

      const matchResult = matchDocuments({
        purchaseOrder: purchaseOrderData,
        goodsReceiptNote: goodsReceiptData,
        vendorInvoice: vendorInvoiceData
      });

      const exceptions = detectExceptions({
        purchaseOrder: purchaseOrderData,
        goodsReceiptNote: goodsReceiptData,
        vendorInvoice: vendorInvoiceData,
        matchResult
      });

      // Delegate exceptions to the V4 Exception Lifecycle Manager
      await this.exceptionLifecycleManager.handleDetectedExceptions(exceptions, state, 'mock-audit-session-123');
      
      // Transition state post-intelligence processing
      state.status = 'PROCESSED';
      state.lastUpdated = new Date().toISOString();
      await this.persistenceAdapter.saveTransactionState(state);
      
    } catch (error) {
      // Isolate failures without crashing the orchestration layer
      state.status = 'FAILED';
      state.lastUpdated = new Date().toISOString();
      await this.persistenceAdapter.saveTransactionState(state);
      
      throw new Error(`Orchestration failed for transaction ${transactionId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
