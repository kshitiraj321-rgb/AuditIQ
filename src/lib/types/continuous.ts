export type IdempotencyKey = string;

export interface IngestionPayload {
  idempotencyKey: IdempotencyKey;
  sourceSystem: string;
  timestamp: string;
  payloadType: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'INVOICE' | 'FINANCIAL_RECORD';
  data: Record<string, any>;
}

export interface TransactionState {
  transactionId: string;
  status: 'PENDING' | 'READY' | 'PROCESSED' | 'FAILED';
  purchaseOrderPayload?: IngestionPayload;
  goodsReceiptPayload?: IngestionPayload;
  invoicePayload?: IngestionPayload;
  lastUpdated: string;
  idempotencyKeys: IdempotencyKey[];
}
