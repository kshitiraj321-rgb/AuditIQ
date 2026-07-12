import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import { classifyDocument, verifyClassificationByContent } from '../lib/classifier';
import { extractDocumentData, ExtractedDocumentData } from '../lib/extractor';
import { ContinuousOrchestrator } from '../lib/orchestrator';
import { TransactionStagingService } from '../lib/services/transactionStagingService';
import { ExceptionLifecycleManager } from '../lib/services/exceptionLifecycleManager';
import { PolicyEngine } from '../lib/services/policyEngine';
import { FinancialTolerancePolicy } from '../lib/policies/financialTolerancePolicy';

import { IPersistenceAdapter } from '../lib/interfaces/continuousInterfaces';
import { IExceptionRepository } from '../lib/interfaces/exceptionInterfaces';
import { TransactionState, IdempotencyKey, IngestionPayload } from '../lib/types/continuous';
import { ExceptionState, AuditLogEntry, PolicyDecision } from '../lib/types/exceptionLifecycle';
import { bootstrapPersistence } from '../lib/persistence/bootstrap';

// --- MOCKS ---
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

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }
}



// --- E2E RUNNER ---

const SCENARIOS = [
  {
    id: "VAL-001",
    name: "Happy Path",
    files: ["01_perfect_match_po.pdf", "02_perfect_match_grn.pdf", "03_perfect_match_inv.pdf"]
  },
  {
    id: "VAL-004", // Quantity Mismatch based on prefixes
    name: "Quantity Mismatch",
    files: ["04_quantity_mismatch_po.pdf", "05_quantity_mismatch_grn.pdf", "06_quantity_mismatch_inv.pdf"]
  },
  {
    id: "VAL-006", // Price Variance
    name: "Price Variance",
    files: ["07_price_variance_po.pdf", "08_price_variance_grn.pdf", "09_price_variance_inv.pdf"]
  },
  {
    id: "VAL-002", // Missing GRN
    name: "Missing GRN",
    files: ["10_missing_grn_po.pdf", "11_missing_grn_inv.pdf"]
  },
  {
    id: "VAL-005", // Duplicate Invoice
    name: "Duplicate Invoice",
    files: ["12_duplicate_invoice_po.pdf", "13_duplicate_invoice_grn.pdf", "14_duplicate_invoice_inv.pdf", "15_duplicate_invoice_invcopy.pdf"]
  }
];

async function extractPdfText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as Array<{ str?: string }>;
    const pageText = textItems
      .map((item) => item.str ?? "")
      .join(" ")
      .trim();
    if (pageText) pageTexts.push(pageText);
  }
  return pageTexts.join("\n");
}

function generateHash(data: any): string {
  // Deep clone and strip out non-deterministic fields
  const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
    // 1. Remove iteration counters
    if (key === 'iteration') return undefined; 
    
    // 2. Remove timestamps
    if (key === 'timestamp' || key === 'lastUpdated') return 'REDACTED_TIMESTAMP';
    
    // 3. Remove execution duration/metrics
    if (key === 'durationMs') return undefined;
    
    // 4. Standardize dynamically generated Exception IDs (UUIDs)
    if (key === 'id' && typeof value === 'string' && value.startsWith('EXC-')) {
      return 'EXC-REDACTED';
    }
    if (key === 'exceptionId' && typeof value === 'string' && value.startsWith('EXC-')) {
      return 'EXC-REDACTED';
    }

    return value;
  }));

  return crypto.createHash('sha256').update(JSON.stringify(cleanData)).digest('hex');
}

async function runValidation() {
  const testDataDir = path.resolve(__dirname, '../../validation/datasets');
  const snapshots: Record<string, any[]> = {};
  const metrics: Record<string, any> = {};

  let anyFailed = false;

  console.log("Starting End-to-End Raw PDF Validation...");

  for (const scenario of SCENARIOS) {
    console.log(`\nExecuting Scenario: ${scenario.name}`);
    const scenarioSnapshots: any[] = [];
    const hashes = new Set<string>();

    for (let iter = 1; iter <= 5; iter++) {
      const startTime = Date.now();
      
      const persistenceAdapter = new InMemoryPersistenceAdapter();
      
      const bootstrapResult = bootstrapPersistence(':memory:');
      if (iter === 1) {
        console.log('Persistence Diagnostics:', JSON.stringify({
          initialized: bootstrapResult.providerInitialized,
          fallback: bootstrapResult.fallbackUsed,
          mode: bootstrapResult.repositoryMode,
          path: bootstrapResult.databasePath,
          integrity: bootstrapResult.integrityStatus
        }));
      }

      const auditRepo = bootstrapResult.getAuditSessionRepository();
      const exceptionRepository = bootstrapResult.getExceptionRepository();
      
      const stagingService = new TransactionStagingService();
      const policyEngine = new PolicyEngine([new FinancialTolerancePolicy()]);
      const lifecycleManager = new ExceptionLifecycleManager(policyEngine, exceptionRepository);
      
      const auditSessionId = `mock-audit-session-${scenario.id}`;
      await auditRepo.save({
        id: auditSessionId,
        timestamp: new Date().toISOString(),
        analysisVersion: 'v4',
        persistenceVersion: '1',
        status: 'RUNNING'
      });
      
      // Override the orchestrator with our patched session ID to properly link exceptions
      const orchestrator = new ContinuousOrchestrator(persistenceAdapter, stagingService, {
        handleDetectedExceptions: async (exceptions: any, state: any) => {
          return lifecycleManager.handleDetectedExceptions(exceptions, state, auditSessionId);
        }
      } as any);

      const transactionId = `TX-${scenario.id}`;
      const iterSnapshots: any = { iteration: iter, stages: {} };

      for (const fileName of scenario.files) {
        const filePath = path.join(testDataDir, fileName);
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File missing: ${filePath}`);
        }

        // 1. Raw PDF Ingestion / Extraction
        const text = await extractPdfText(filePath);
        
        // 2. Document Classification
        const classification = classifyDocument(fileName);
        const verification = verifyClassificationByContent(classification.type, text, classification.confidence);
        const finalType = verification.verified ? verification.contentType : classification.type;

        // 3. Extraction
        const extractedData = extractDocumentData(finalType || "Unknown", text, null);

        // Snapshot
        iterSnapshots.stages[fileName] = {
          classification: { ...classification, ...verification, finalType },
          extractedData
        };

        if (extractedData) {
          const payloadType = 
            finalType === "Purchase Order" ? 'PURCHASE_ORDER' :
            finalType === "Goods Receipt Note" ? 'GOODS_RECEIPT' : 'INVOICE';

          // Simulate orchestrator ingestion
          await orchestrator.processIncomingEvent({
            idempotencyKey: `idempotency-${transactionId}-${fileName}`,
            sourceSystem: 'FILE_UPLOAD',
            timestamp: new Date().toISOString(),
            payloadType: payloadType as any,
            data: { transactionId, ...extractedData }
          });
        }
      }

      // Force Trigger Intelligence if missing docs
      let state = await persistenceAdapter.getTransactionState(transactionId);
      if (state && state.status !== 'PROCESSED') {
        state.status = 'READY';
        await persistenceAdapter.saveTransactionState(state);
        await orchestrator.triggerIntelligencePipeline(transactionId);
      }
      
      const finalState = await persistenceAdapter.getTransactionState(transactionId);
      const exceptions = await exceptionRepository.getByTransactionId(transactionId);
      const allExceptions = await exceptionRepository.getByAuditSessionId(auditSessionId);

      iterSnapshots.finalState = finalState;
      iterSnapshots.exceptions = exceptions.length > 0 ? exceptions : allExceptions;
      
      const hash = generateHash(iterSnapshots);
      hashes.add(hash);
      
      if (iter === 1) {
        scenarioSnapshots.push(iterSnapshots);
        metrics[scenario.id] = { durationMs: Date.now() - startTime };
      }
      
      if (bootstrapResult.provider) {
        bootstrapResult.provider.close();
      }

    }

    if (hashes.size !== 1) {
      console.error(`❌ DETERMINISM FAILURE for ${scenario.name}: Produced ${hashes.size} unique hashes across 5 runs.`);
      anyFailed = true;
    } else {
      console.log(`✅ Determinism verified for ${scenario.name} (1 unique hash).`);
    }

    snapshots[scenario.id] = scenarioSnapshots;
  }

  // Dump evidence
  fs.writeFileSync(path.resolve(__dirname, '../../e2e_validation_results.json'), JSON.stringify({ snapshots, metrics }, null, 2));
  
  if (anyFailed) {
    console.error("\nValidation failed due to determinism or defect. Generating Root Cause Report...");
  } else {
    console.log("\nValidation succeeded! All scenarios processed deterministically.");
  }
}

runValidation().catch(console.error);
