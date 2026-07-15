import { Transaction, PurchaseOrder } from '../types/index';

/**
 * Defines the canonical contract that all external enterprise systems must satisfy.
 * By enforcing this interface, the business intelligence layers are shielded from
 * vendor-specific schemas (e.g., SAP, Oracle, NetSuite).
 * 
 * Required by Blueprint V4 Section 14.6 (Enterprise Integrations).
 * Architecture Invariant: INT-01 and INT-02.
 */
export interface EnterpriseIngestionAdapter {
  /**
   * Translates a vendor-specific transaction payload into the AuditIQ canonical Transaction model.
   * @param rawPayload The external system's raw payload
   */
  ingestTransaction(rawPayload: unknown): Transaction;

  /**
   * Translates a vendor-specific purchase order payload into the AuditIQ canonical PurchaseOrder model.
   * @param rawPayload The external system's raw payload
   */
  ingestPurchaseOrder(rawPayload: unknown): PurchaseOrder;

  /**
   * Health check to ensure the external system connection is operational.
   */
  checkConnection(): boolean;
}
