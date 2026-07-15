import { Transaction, PurchaseOrder } from '../types/index';
import { EnterpriseIngestionAdapter } from '../interfaces/integrationInterfaces';

/**
 * Mock Oracle Adapter to translate Oracle EBS / NetSuite specific structures into AuditIQ canonical models.
 * Preserves vendor independence for core business logic.
 */
export class OracleAdapter implements EnterpriseIngestionAdapter {
  ingestTransaction(rawPayload: unknown): Transaction {
    // In a live environment, this parses the Oracle payload (e.g. JSON from Oracle Integration Cloud).
    const oracleData = rawPayload as any;
    
    return {
      id: oracleData?.INVOICE_ID || `tx-oracle-${Date.now()}`,
      vendorId: oracleData?.SUPPLIER_NUMBER || 'VEN-002',
      departmentId: oracleData?.COST_CENTER || 'DEPT-002',
      amount: parseFloat(oracleData?.INVOICE_AMOUNT) || 20000,
      currency: oracleData?.INVOICE_CURRENCY_CODE || 'USD',
      date: oracleData?.INVOICE_DATE || new Date().toISOString(),
      type: 'INVOICE',
      status: 'PENDING',
      confidence: 1.0,
      metadata: {
        sourceSystem: 'ORACLE_EBS',
        rawId: oracleData?.INVOICE_ID
      }
    };
  }

  ingestPurchaseOrder(rawPayload: unknown): PurchaseOrder {
    const oracleData = rawPayload as any;
    
    return {
      id: oracleData?.PO_HEADER_ID || `po-oracle-${Date.now()}`,
      vendorId: oracleData?.SUPPLIER_NUMBER || 'VEN-002',
      departmentId: oracleData?.COST_CENTER || 'DEPT-002',
      totalAmount: parseFloat(oracleData?.PO_TOTAL) || 20000,
      status: 'APPROVED',
      date: oracleData?.CREATION_DATE || new Date().toISOString(),
      items: oracleData?.PO_LINES || []
    };
  }

  checkConnection(): boolean {
    // Simulates an active Oracle connection check
    return true;
  }
}
