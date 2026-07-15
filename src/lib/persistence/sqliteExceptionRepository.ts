import { DatabaseSync } from 'node:sqlite';
import { IExceptionRepository } from '../interfaces/exceptionInterfaces';
import { ExceptionState, AuditLogEntry } from '../types/exceptionLifecycle';
import { translateSqliteError } from './errors';

export class SqliteExceptionRepository implements IExceptionRepository {
  constructor(private readonly db: DatabaseSync) {}

  private transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = operation();
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  async save(state: ExceptionState): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.transaction(() => {
          const existingStmt = this.db.prepare('SELECT id FROM exceptions WHERE id = ?');
          const existing = existingStmt.get(state.id);

          if (existing) {
            const updateStmt = this.db.prepare(`
              UPDATE exceptions 
              SET auditSessionId = ?, transactionId = ?, type = ?, status = ?, severity = ?, message = ?, auditTrail = ?, metadata = ?
              WHERE id = ?
            `);
            updateStmt.run(
              state.auditSessionId!,
              state.transactionId,
              state.type,
              state.status,
              state.severity,
              state.message || null,
              JSON.stringify(state.auditTrail),
              state.metadata ? JSON.stringify(state.metadata) : null,
              state.id
            );
          } else {
            const insertStmt = this.db.prepare(`
              INSERT INTO exceptions (id, auditSessionId, transactionId, type, status, severity, message, auditTrail, metadata)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insertStmt.run(
              state.id,
              state.auditSessionId!,
              state.transactionId,
              state.type,
              state.status,
              state.severity,
              state.message || null,
              JSON.stringify(state.auditTrail),
              state.metadata ? JSON.stringify(state.metadata) : null
            );
          }
        });
        resolve();
      } catch (error) {
        reject(translateSqliteError('saveException', error));
      }
    });
  }

  async getById(id: string): Promise<ExceptionState | null> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM exceptions WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) {
          return resolve(null);
        }
        resolve(this.mapRowToState(row));
      } catch (error) {
        reject(translateSqliteError('getExceptionById', error));
      }
    });
  }

  async getByTransactionId(transactionId: string): Promise<ExceptionState[]> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM exceptions WHERE transactionId = ?');
        const rows = stmt.all(transactionId) as any[];
        resolve(rows.map(row => this.mapRowToState(row)));
      } catch (error) {
        reject(translateSqliteError('getExceptionByTransactionId', error));
      }
    });
  }

  async getByAuditSessionId(auditSessionId: string): Promise<ExceptionState[]> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM exceptions WHERE auditSessionId = ?');
        const rows = stmt.all(auditSessionId) as any[];
        resolve(rows.map(row => this.mapRowToState(row)));
      } catch (error) {
        reject(translateSqliteError('getExceptionByAuditSessionId', error));
      }
    });
  }

  async appendAuditLog(exceptionId: string, log: AuditLogEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.transaction(() => {
          const stmt = this.db.prepare('SELECT auditTrail FROM exceptions WHERE id = ?');
          const row = stmt.get(exceptionId) as { auditTrail: string } | undefined;
          
          if (!row) {
            // If the exception doesn't exist, we can't append. 
            // Depending on strictness, we might throw NOT_FOUND or just skip. 
            // In a strict repository, we throw.
            throw new Error('NOT_FOUND: Exception not found');
          }

          const auditTrail: AuditLogEntry[] = JSON.parse(row.auditTrail);
          auditTrail.push(log);

          const updateStmt = this.db.prepare('UPDATE exceptions SET auditTrail = ? WHERE id = ?');
          updateStmt.run(JSON.stringify(auditTrail), exceptionId);
        });
        resolve();
      } catch (error) {
        reject(translateSqliteError('appendAuditLog', error));
      }
    });
  }

  private mapRowToState(row: any): ExceptionState {
    return {
      id: row.id,
      auditSessionId: row.auditSessionId,
      transactionId: row.transactionId,
      type: row.type,
      status: row.status,
      severity: row.severity,
      message: row.message || undefined,
      auditTrail: JSON.parse(row.auditTrail),
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }
}
