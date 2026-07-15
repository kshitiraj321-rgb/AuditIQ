import { DatabaseSync } from 'node:sqlite';
import { IAuditSessionRepository } from '../interfaces/exceptionInterfaces';
import { IAuditSession } from '../types/exceptionLifecycle';
import { PersistenceError, PersistenceErrorCode, translateSqliteError } from './errors';

export class SqliteAuditSessionRepository implements IAuditSessionRepository {
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

  async save(session: IAuditSession): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.transaction(() => {
          // Check if it exists to enforce immutability
          const existingStmt = this.db.prepare('SELECT status FROM audit_sessions WHERE id = ?');
          const existing = existingStmt.get(session.id) as { status: string } | undefined;

          if (existing) {
            if (existing.status === 'COMPLETED' || existing.status === 'FAILED') {
              throw new PersistenceError(
                PersistenceErrorCode.IMMUTABILITY_VIOLATION,
                'saveAuditSession',
                new Error(`Cannot update session ${session.id} because it is in a terminal state (${existing.status})`)
              );
            }

            const updateStmt = this.db.prepare(`
              UPDATE audit_sessions 
              SET timestamp = ?, analysisVersion = ?, persistenceVersion = ?, status = ?, inputFingerprint = ?, metadata = ?
              WHERE id = ?
            `);
            updateStmt.run(
              session.timestamp,
              session.analysisVersion,
              session.persistenceVersion,
              session.status,
              session.inputFingerprint || null,
              session.metadata ? JSON.stringify(session.metadata) : null,
              session.id
            );
          } else {
            const insertStmt = this.db.prepare(`
              INSERT INTO audit_sessions (id, timestamp, analysisVersion, persistenceVersion, status, inputFingerprint, metadata)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            insertStmt.run(
              session.id,
              session.timestamp,
              session.analysisVersion,
              session.persistenceVersion,
              session.status,
              session.inputFingerprint || null,
              session.metadata ? JSON.stringify(session.metadata) : null
            );
          }
        });
        resolve();
      } catch (error) {
        reject(translateSqliteError('saveAuditSession', error));
      }
    });
  }

  async getById(id: string): Promise<IAuditSession | null> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM audit_sessions WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) {
          return resolve(null);
        }

        const session: IAuditSession = {
          id: row.id,
          timestamp: row.timestamp,
          analysisVersion: row.analysisVersion,
          persistenceVersion: row.persistenceVersion,
          status: row.status,
          inputFingerprint: row.inputFingerprint || undefined,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };
        resolve(session);
      } catch (error) {
        reject(translateSqliteError('getAuditSessionById', error));
      }
    });
  }
}
