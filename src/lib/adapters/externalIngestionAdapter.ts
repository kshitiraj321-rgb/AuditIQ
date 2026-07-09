import { IngestionPayload } from '../types/continuous';
import { IIngestionAdapter, IEventOrchestrator } from '../interfaces/continuousInterfaces';

/**
 * ExternalIngestionAdapter serves as the reference implementation for
 * receiving events from external systems (e.g., ERPs, Webhooks, Message Queues).
 *
 * Rules Enforced:
 * - Normalizes raw arbitrary events into the canonical IngestionPayload.
 * - Delegates all orchestration and business decisions to the ContinuousOrchestrator.
 * - Never performs transaction staging, persistence, or validation.
 */
export class ExternalIngestionAdapter implements IIngestionAdapter {
  constructor(private orchestrator: IEventOrchestrator) {}

  /**
   * Normalizes an external raw payload into the canonical IngestionPayload format.
   * In a production environment, this method would contain technology-specific
   * schema validation (e.g., Zod) for various ERP webhook structures.
   *
   * @param rawPayload The arbitrary untyped payload from an external transport
   * @returns The normalized canonical payload
   */
  public async receiveEvent(rawPayload: any): Promise<IngestionPayload> {
    // Reference implementation mapping.
    // In production, this would explicitly map fields from specific vendor payloads (e.g., SAP, Oracle).
    const normalizedPayload: IngestionPayload = {
      idempotencyKey: String(rawPayload.eventId || rawPayload.idempotencyKey || Date.now().toString()),
      sourceSystem: String(rawPayload.source || 'UNKNOWN_EXTERNAL_SYSTEM'),
      timestamp: String(rawPayload.timestamp || new Date().toISOString()),
      payloadType: this.mapPayloadType(rawPayload.type),
      data: rawPayload.data || rawPayload,
    };

    // Strictly delegate execution to the core orchestrator, preserving 
    // the transaction staging boundary mandated by the architecture.
    await this.orchestrator.processIncomingEvent(normalizedPayload);

    return normalizedPayload;
  }

  /**
   * Translates external event types into the canonical AuditIQ payload types.
   */
  private mapPayloadType(rawType: string): IngestionPayload['payloadType'] {
    const normalizedType = String(rawType).toUpperCase();
    switch (normalizedType) {
      case 'PO':
      case 'PURCHASE_ORDER':
        return 'PURCHASE_ORDER';
      case 'GRN':
      case 'GOODS_RECEIPT':
        return 'GOODS_RECEIPT';
      case 'INV':
      case 'INVOICE':
        return 'INVOICE';
      default:
        return 'FINANCIAL_RECORD';
    }
  }
}
