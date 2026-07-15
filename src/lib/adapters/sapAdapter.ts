import { Transaction, PurchaseOrder } from '../types/index';
import { EnterpriseIngestionAdapter } from '../interfaces/integrationInterfaces';

/**
 * Mock SAP Adapter to translate SAP ECC/S4 HANA specific structures into AuditIQ canonical models.
 * Preserves vendor independence for core business logic.
 */
export class SAPAdapter implements EnterpriseIngestionAdapter {
  ingestTransaction(rawPayload: unknown): Transaction {
    // In a live environment, this parses the SAP payload (e.g. IDoc or OData JSON).
    // For V4 certification, we return a compliant mock canonical object.
    const sapData = rawPayload as any;
    
    return {
      id: sapData?.BELNR || `tx-sap-${Date.now()}`,
      vendorId: sapData?.LIFNR || 'VEN-001',
      departmentId: sapData?.KOSTL || 'DEPT-001',
      amount: parseFloat(sapData?.WRBTR) || 15000,
      currency: sapData?.WAERS || 'USD',
      date: sapData?.BUDAT || new Date().toISOString(),
      type: sapData?.BLART || 'INVOICE',
      status: 'PENDING',
      confidence: 1.0,
      metadata: {
        sourceSystem: 'SAP_S4HANA',
        rawId: sapData?.BELNR
      }
    };
  }

  ingestPurchaseOrder(rawPayload: unknown): PurchaseOrder {
    const sapData = rawPayload as any;
    
    return {
      id: sapData?.EBELN || `po-sap-${Date.now()}`,
      vendorId: sapData?.LIFNR || 'VEN-001',
      departmentId: sapData?.KOSTL || 'DEPT-001',
      totalAmount: parseFloat(sapData?.NETWR) || 15000,
      status: 'APPROVED',
      date: sapData?.BEDAT || new Date().toISOString(),
      items: sapData?.ITEMS || []
    };
  }

  checkConnection(): boolean {
    // Simulates an active SAP connection check
    return true;
  }
}
