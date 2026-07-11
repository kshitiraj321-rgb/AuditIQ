import * as fs from 'fs';
import * as path from 'path';

import { ContinuousOrchestrator } from '../lib/orchestrator';
import { TransactionStagingService } from '../lib/services/transactionStagingService';
import { ExceptionLifecycleManager } from '../lib/services/exceptionLifecycleManager';
import { PolicyEngine } from '../lib/services/policyEngine';
import { FinancialTolerancePolicy } from '../lib/policies/financialTolerancePolicy';

import { IPersistenceAdapter } from '../lib/interfaces/continuousInterfaces';
import { IExceptionRepository } from '../lib/interfaces/exceptionInterfaces';
import { TransactionState, IdempotencyKey, IngestionPayload } from '../lib/types/continuous';
import { ExceptionState, AuditLogEntry } from '../lib/types/exceptionLifecycle';
import { detectExceptions } from '../lib/exceptionEngine';
import { bootstrapPersistence } from '../lib/persistence/bootstrap';

class InMemoryPersistenceAdapter implements IPersistenceAdapter {
  private transactions = new Map<string, TransactionState>();
  private idempotencyKeys = new Set<string>();

  async saveTransactionState(state: TransactionState): Promise<void> {
    this.transactions.set(state.transactionId, { ...state });
  }

  async getTransactionState(transactionId: string): Promise<TransactionState | null> {
    return this.transactions.get(transactionId) || null;
  }

  async checkIdempotency(key: IdempotencyKey): Promise<boolean> {
    return this.idempotencyKeys.has(key);
  }

  async markIdempotency(key: IdempotencyKey): Promise<void> {
    this.idempotencyKeys.add(key);
  }

  // Helper for testing
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }
}



async function runValidation() {
  console.log("=========================================");
  console.log("AuditIQ Production Validation Runner v1.0");
  console.log("=========================================\n");

  const persistenceAdapter = new InMemoryPersistenceAdapter();
  
  const bootstrapResult = bootstrapPersistence(path.join(__dirname, '../../test_validation.db'));
  console.log('Persistence Diagnostics:', JSON.stringify({
    initialized: bootstrapResult.providerInitialized,
    fallback: bootstrapResult.fallbackUsed,
    mode: bootstrapResult.repositoryMode,
    path: bootstrapResult.databasePath,
    integrity: bootstrapResult.integrityStatus
  }, null, 2));

  const auditRepo = bootstrapResult.getAuditSessionRepository();
  const exceptionRepository = bootstrapResult.getExceptionRepository();
  const stagingService = new TransactionStagingService();
  
  const policyEngine = new PolicyEngine([new FinancialTolerancePolicy()]);
  const lifecycleManager = new ExceptionLifecycleManager(policyEngine, exceptionRepository);
  
  // Create an audit session for the validation run
  await auditRepo.save({
    id: 'mock-audit-session-123',
    timestamp: new Date().toISOString(),
    analysisVersion: 'v4',
    persistenceVersion: '1',
    status: 'RUNNING'
  });
  
  const orchestrator = new ContinuousOrchestrator(persistenceAdapter, stagingService, lifecycleManager);

  // Scenarios defined in Validation_Dataset_Matrix.md
  const scenarios = [
    {
      id: "VAL-001",
      name: "Happy Path (Perfect Match)",
      po: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-001", grnNumber: "GRN-001", invoiceNumber: "INV-001" },
      grn: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-001", grnNumber: "GRN-001", invoiceNumber: "INV-001" },
      inv: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-001", grnNumber: "GRN-001", invoiceNumber: "INV-001", vendorName: "Test Vendor", documentNumber: "INV-001" }
    },
    {
      id: "VAL-002",
      name: "Missing Invoice",
      po: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-002", grnNumber: "GRN-002", invoiceNumber: "INV-002" },
      grn: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-002", grnNumber: "GRN-002", invoiceNumber: "INV-002" },
      inv: null
    },
    {
      id: "VAL-003",
      name: "Missing PO",
      po: null,
      grn: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-003", grnNumber: "GRN-003", invoiceNumber: "INV-003" },
      inv: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-003", grnNumber: "GRN-003", invoiceNumber: "INV-003", vendorName: "Test Vendor", documentNumber: "INV-003" }
    },
    {
      id: "VAL-004",
      name: "Missing GRN",
      po: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-004", grnNumber: "GRN-004", invoiceNumber: "INV-004" },
      grn: null,
      inv: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-004", grnNumber: "GRN-004", invoiceNumber: "INV-004", vendorName: "Test Vendor", documentNumber: "INV-004" }
    },
    {
      id: "VAL-005",
      name: "Duplicate Invoice",
      // We will inject two invoices for this one
      po: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-005", grnNumber: "GRN-005", invoiceNumber: "INV-005" },
      grn: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-005", grnNumber: "GRN-005", invoiceNumber: "INV-005" },
      inv: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-005", grnNumber: "GRN-005", invoiceNumber: "INV-005", vendorName: "Test Vendor", documentNumber: "INV-005" },
      duplicateInv: true
    },
    {
      id: "VAL-006",
      name: "Minor Price Variance (Auto-resolved)",
      po: { quantity: 100, unitPrice: 100, amount: 10000, poNumber: "PO-006", grnNumber: "GRN-006", invoiceNumber: "INV-006" },
      grn: { quantity: 100, unitPrice: 100, amount: 10000, poNumber: "PO-006", grnNumber: "GRN-006", invoiceNumber: "INV-006" },
      inv: { quantity: 100, unitPrice: 102.5, amount: 10250, poNumber: "PO-006", grnNumber: "GRN-006", invoiceNumber: "INV-006", vendorName: "Test Vendor", documentNumber: "INV-006" }
    },
    {
      id: "VAL-007",
      name: "Major Price Variance (Manual Review)",
      po: { quantity: 100, unitPrice: 1000, amount: 100000, poNumber: "PO-007", grnNumber: "GRN-007", invoiceNumber: "INV-007" },
      grn: { quantity: 100, unitPrice: 1000, amount: 100000, poNumber: "PO-007", grnNumber: "GRN-007", invoiceNumber: "INV-007" },
      inv: { quantity: 100, unitPrice: 1150, amount: 115000, poNumber: "PO-007", grnNumber: "GRN-007", invoiceNumber: "INV-007", vendorName: "Test Vendor", documentNumber: "INV-007" }
    },
    {
      id: "VAL-008",
      name: "Quantity Mismatch",
      po: { quantity: 50, unitPrice: 500, amount: 25000, poNumber: "PO-008", grnNumber: "GRN-008", invoiceNumber: "INV-008" },
      grn: { quantity: 45, unitPrice: 500, amount: 22500, poNumber: "PO-008", grnNumber: "GRN-008", invoiceNumber: "INV-008" },
      inv: { quantity: 50, unitPrice: 500, amount: 25000, poNumber: "PO-008", grnNumber: "GRN-008", invoiceNumber: "INV-008", vendorName: "Test Vendor", documentNumber: "INV-008" }
    },
    {
      id: "VAL-009",
      name: "Timeline Deviation",
      po: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-009", grnNumber: "GRN-009", invoiceNumber: "INV-009", normalizedDate: "2026-05-01" },
      grn: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-009", grnNumber: "GRN-009", invoiceNumber: "INV-009", normalizedDate: "2026-04-20" },
      inv: { quantity: 100, unitPrice: 500, amount: 50000, poNumber: "PO-009", grnNumber: "GRN-009", invoiceNumber: "INV-009", vendorName: "Test Vendor", documentNumber: "INV-009", normalizedDate: "2026-05-15" }
    },
    {
      id: "VAL-010",
      name: "Multiple Exceptions",
      po: { quantity: 50, unitPrice: 100, amount: 5000, poNumber: "PO-010", grnNumber: "GRN-010", invoiceNumber: "INV-010" },
      grn: { quantity: 45, unitPrice: 100, amount: 4500, poNumber: "PO-010", grnNumber: "GRN-010", invoiceNumber: "INV-010" },
      inv: { quantity: 50, unitPrice: 105, amount: 5250, poNumber: "PO-010", grnNumber: "GRN-010", invoiceNumber: "INV-010", vendorName: "Test Vendor", documentNumber: "INV-010" }
    }
  ];

  let rawDuplicateTriggered = false;

  for (const scenario of scenarios) {
    console.log(`Executing Scenario: ${scenario.id} - ${scenario.name}`);
    const transactionId = `TX-${scenario.id}`;
    
    // Construct payloads
    if (scenario.po) {
      await orchestrator.processIncomingEvent({
        idempotencyKey: `idk-${scenario.id}-po`,
        sourceSystem: 'ERP',
        timestamp: new Date().toISOString(),
        payloadType: 'PURCHASE_ORDER',
        data: { transactionId, ...scenario.po }
      });
    }

    if (scenario.grn) {
      await orchestrator.processIncomingEvent({
        idempotencyKey: `idk-${scenario.id}-grn`,
        sourceSystem: 'WMS',
        timestamp: new Date().toISOString(),
        payloadType: 'GOODS_RECEIPT',
        data: { transactionId, ...scenario.grn }
      });
    }

    if (scenario.inv) {
      await orchestrator.processIncomingEvent({
        idempotencyKey: `idk-${scenario.id}-inv`,
        sourceSystem: 'FINANCE',
        timestamp: new Date().toISOString(),
        payloadType: 'INVOICE',
        data: { transactionId, ...scenario.inv }
      });
    }
    
    // In production, timeouts handle partial docs. Here we force readiness.
    let state = await persistenceAdapter.getTransactionState(transactionId);
    if (state && state.status !== 'PROCESSED') {
      state.status = 'READY'; 
      await persistenceAdapter.saveTransactionState(state);
      await orchestrator.triggerIntelligencePipeline(transactionId);
    }
    
    // Duplicate Invoice logic mapping
    if (scenario.duplicateInv) {
      console.log(`  -> Injecting duplicate invoice for ${scenario.id}`);
      rawDuplicateTriggered = true;
      // In the exceptionEngine, duplicates are checked against `existingInvoices`.
      // We will manually trigger a check here for validation completeness.
      const exceptionsForDup = detectExceptions({
        purchaseOrder: scenario.po as any,
        goodsReceiptNote: scenario.grn as any,
        vendorInvoice: scenario.inv as any,
        matchResult: { quantityMatch: { matched: true, po: 100, grn: 100, invoice: 100 }, priceMatch: { matched: true, po: 500, grn: 500, invoice: 500 }, amountMatch: { matched: true, po: 50000, grn: 50000, invoice: 50000 }, poNumberMatch: { matched: true, po: "a", grn: "a", invoice: "a", normalizedPo: "a", normalizedGrn: "a", normalizedInvoice: "a" }, grnNumberMatch: { matched: true, po: "a", grn: "a", invoice: "a", normalizedPo: "a", normalizedGrn: "a", normalizedInvoice: "a" } },
        existingInvoices: [{ vendorName: scenario.inv!.vendorName as string, invoiceNumber: scenario.inv!.invoiceNumber as string }]
      });

      // Force state for duplicate
      const dupTransactionId = `TX-${scenario.id}-DUP`;
      let dupState = {
        transactionId: dupTransactionId,
        status: 'READY' as const,
        lastUpdated: new Date().toISOString(),
        idempotencyKeys: [],
        purchaseOrderPayload: { data: scenario.po } as any,
        goodsReceiptPayload: { data: scenario.grn } as any,
        invoicePayload: { data: scenario.inv } as any,
      };
      
      await lifecycleManager.handleDetectedExceptions(exceptionsForDup, dupState, 'mock-audit-session-123');
    }

    // Evaluate Results
    const finalState = await persistenceAdapter.getTransactionState(transactionId);
    const exceptions = await exceptionRepository.getByTransactionId(transactionId);
    
    console.log(`  Transaction Status: ${finalState?.status}`);
    console.log(`  Exceptions Generated: ${exceptions.length}`);
    exceptions.forEach(ex => {
      console.log(`    - Type: ${ex.type}`);
      console.log(`      Status: ${ex.status}`);
      console.log(`      Final Audit: ${ex.auditTrail[ex.auditTrail.length - 1].action} (${ex.auditTrail[ex.auditTrail.length - 1].reason})`);
    });
    
    if (scenario.duplicateInv) {
        const dupExceptions = await exceptionRepository.getByTransactionId(`TX-${scenario.id}-DUP`);
        console.log(`  Duplicate Exceptions Generated: ${dupExceptions.length}`);
        dupExceptions.forEach(ex => {
          console.log(`    - Type: ${ex.type}`);
          console.log(`      Status: ${ex.status}`);
          console.log(`      Final Audit: ${ex.auditTrail[ex.auditTrail.length - 1].action} (${ex.auditTrail[ex.auditTrail.length - 1].reason})`);
        });
    }

    console.log("-----------------------------------------\n");
  }
}

runValidation().catch(console.error);
