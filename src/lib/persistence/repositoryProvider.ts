import { DatabaseSync } from 'node:sqlite';
import { createConnection, DatabaseConfig } from './connection';
import { MigrationRunner } from './migrationRunner';
import { RepositoryFactory } from './repositoryFactory';
import { PersistenceError, PersistenceErrorCode } from './errors';
import { IAuditSessionRepository, IExceptionRepository } from '../interfaces/exceptionInterfaces';

export enum RepositoryMode {
  READ_WRITE = 'READ_WRITE',
  READ_ONLY = 'READ_ONLY'
}

export class RepositoryProvider {
  private factory: RepositoryFactory;
  private db: DatabaseSync;

  constructor(
    config: DatabaseConfig = {},
    private readonly mode: RepositoryMode = RepositoryMode.READ_WRITE
  ) {
    this.db = createConnection(config);
    
    // Check integrity
    const integrity = this.db.prepare('PRAGMA integrity_check;').get() as { integrity_check: string };
    if (integrity.integrity_check !== 'ok') {
      throw new PersistenceError(PersistenceErrorCode.DATABASE_CORRUPTED, 'initialization');
    }

    if (this.mode === RepositoryMode.READ_WRITE) {
      const runner = new MigrationRunner(this.db);
      runner.runMigrations();
    }
    
    this.factory = new RepositoryFactory(this.db);
  }

  public getAuditSessionRepository(): IAuditSessionRepository {
    const repo = this.factory.createAuditSessionRepository();
    if (this.mode === RepositoryMode.READ_ONLY) {
      return this.createReadOnlyAuditSessionProxy(repo);
    }
    return repo;
  }

  public getExceptionRepository(): IExceptionRepository {
    const repo = this.factory.createExceptionRepository();
    if (this.mode === RepositoryMode.READ_ONLY) {
      return this.createReadOnlyExceptionProxy(repo);
    }
    return repo;
  }

  public close(): void {
    try {
      this.db.close();
    } catch (e) {
      // Ignore if already closed
    }
  }

  private createReadOnlyAuditSessionProxy(repo: IAuditSessionRepository): IAuditSessionRepository {
    return {
      getById: (id) => repo.getById(id),
      save: async () => {
        throw new PersistenceError(PersistenceErrorCode.READ_ONLY_VIOLATION, 'save');
      }
    };
  }

  private createReadOnlyExceptionProxy(repo: IExceptionRepository): IExceptionRepository {
    return {
      getById: (id) => repo.getById(id),
      getByTransactionId: (txId) => repo.getByTransactionId(txId),
      getByAuditSessionId: (auditSessionId) => repo.getByAuditSessionId(auditSessionId),
      save: async () => {
        throw new PersistenceError(PersistenceErrorCode.READ_ONLY_VIOLATION, 'save');
      },
      appendAuditLog: async () => {
        throw new PersistenceError(PersistenceErrorCode.READ_ONLY_VIOLATION, 'appendAuditLog');
      }
    };
  }
}
