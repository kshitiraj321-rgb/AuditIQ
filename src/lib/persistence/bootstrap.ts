import { RepositoryProvider, RepositoryMode } from './repositoryProvider';
import { IAuditSessionRepository, IExceptionRepository } from '../interfaces/exceptionInterfaces';
import { ExceptionState, AuditLogEntry } from '../types/exceptionLifecycle';

export interface PersistenceBootstrapResult {
  provider: RepositoryProvider | null;
  providerInitialized: boolean;
  fallbackUsed: boolean;
  repositoryMode: RepositoryMode;
  databasePath: string;
  schemaVersion: string;
  integrityStatus: string;
  warnings: string[];
  getAuditSessionRepository: () => IAuditSessionRepository;
  getExceptionRepository: () => IExceptionRepository;
}

// Fallback InMemory Implementations
export class InMemoryExceptionRepository implements IExceptionRepository {
  private exceptions = new Map<string, ExceptionState>();

  async save(state: ExceptionState): Promise<void> {
    this.exceptions.set(state.id, { ...state });
  }

  async getById(id: string): Promise<ExceptionState | null> {
    return this.exceptions.get(id) || null;
  }

  async getByTransactionId(transactionId: string): Promise<ExceptionState[]> {
    return Array.from(this.exceptions.values()).filter(ex => ex.transactionId === transactionId);
  }

  async getByAuditSessionId(auditSessionId: string): Promise<ExceptionState[]> {
    return Array.from(this.exceptions.values()).filter(ex => ex.auditSessionId === auditSessionId);
  }

  async appendAuditLog(exceptionId: string, log: AuditLogEntry): Promise<void> {
    const ex = this.exceptions.get(exceptionId);
    if (ex) {
      ex.auditTrail.push(log);
      this.exceptions.set(exceptionId, ex);
    }
  }

  // Helper for testing
  getAllExceptions() {
    return Array.from(this.exceptions.values());
  }
}

export class InMemoryAuditSessionRepository implements IAuditSessionRepository {
  private sessions = new Map<string, any>();
  
  async save(session: any): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }
  
  async getById(id: string): Promise<any | null> {
    return this.sessions.get(id) || null;
  }
}

export function bootstrapPersistence(
  dbPath: string,
  mode: RepositoryMode = RepositoryMode.READ_WRITE
): PersistenceBootstrapResult {
  try {
    const provider = new RepositoryProvider({ dbPath }, mode);
    
    return {
      provider,
      providerInitialized: true,
      fallbackUsed: false,
      repositoryMode: mode,
      databasePath: dbPath,
      schemaVersion: '1',
      integrityStatus: 'ok',
      warnings: [],
      getAuditSessionRepository: () => provider.getAuditSessionRepository(),
      getExceptionRepository: () => provider.getExceptionRepository()
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    const warning = `Persistence unavailable: ${message}. Falling back to InMemoryRepository.`;
    console.warn(`[INFRA_WARNING] ${warning}`);
    
    const fallbackAuditRepo = new InMemoryAuditSessionRepository();
    const fallbackExceptionRepo = new InMemoryExceptionRepository();

    return {
      provider: null,
      providerInitialized: false,
      fallbackUsed: true,
      repositoryMode: mode,
      databasePath: dbPath,
      schemaVersion: 'unknown',
      integrityStatus: 'failed',
      warnings: [warning],
      getAuditSessionRepository: () => fallbackAuditRepo,
      getExceptionRepository: () => fallbackExceptionRepo
    };
  }
}
