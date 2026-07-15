export interface Transaction {
  id: string;
  vendorId: string;
  departmentId: string;
  amount: number;
  currency: string;
  date: string;
  type: string;
  status: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  departmentId: string;
  totalAmount: number;
  status: string;
  date: string;
  items: any[];
}

export interface ExceptionResolution {
  exceptionId: string;
  transactionId: string;
  resolutionType: string;
  resolvedAt: string;
  resolvedBy: string;
  notes?: string;
}

export interface AuditResult {
  transactionId: string;
  status: string;
  timestamp: string;
  details: Record<string, any>;
}

export * from './continuous';
export * from './exceptionLifecycle';
