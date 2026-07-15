import { DatabaseSync } from 'node:sqlite';
import { IAuditSessionRepository, IExceptionRepository } from '../interfaces/exceptionInterfaces';
import { SqliteAuditSessionRepository } from './sqliteAuditSessionRepository';
import { SqliteExceptionRepository } from './sqliteExceptionRepository';

export class RepositoryFactory {
  constructor(private readonly db: DatabaseSync) {}

  public createAuditSessionRepository(): IAuditSessionRepository {
    return new SqliteAuditSessionRepository(this.db);
  }

  public createExceptionRepository(): IExceptionRepository {
    return new SqliteExceptionRepository(this.db);
  }
}
