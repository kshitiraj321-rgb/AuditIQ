import { DatabaseSync } from 'node:sqlite';

const TARGET_SCHEMA_VERSION = 1;

export class MigrationRunner {
  constructor(private readonly db: DatabaseSync) {}

  /**
   * Reads the current PRAGMA user_version and applies all necessary migrations sequentially.
   * This method is fully idempotent.
   */
  public runMigrations(): void {
    const currentVersion = this.getUserVersion();

    if (currentVersion < 1 && TARGET_SCHEMA_VERSION >= 1) {
      this.migrateToV1();
      this.setUserVersion(1);
    }
    
    // Future migrations would go here
    // if (currentVersion < 2 && TARGET_SCHEMA_VERSION >= 2) {
    //   this.migrateToV2();
    //   this.setUserVersion(2);
    // }
  }

  private getUserVersion(): number {
    const row = this.db.prepare('PRAGMA user_version;').get() as { user_version: number };
    return row.user_version;
  }

  private setUserVersion(version: number): void {
    // PRAGMA statements cannot use parameterized inputs via prepare() in the same way,
    // so we interpolate safely as version is strictly typed as a number.
    this.db.exec(`PRAGMA user_version = ${version};`);
  }

  private migrateToV1(): void {
    // Wrap in a transaction for atomicity
    this.db.exec('BEGIN EXCLUSIVE TRANSACTION;');
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_sessions (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          analysisVersion TEXT NOT NULL,
          persistenceVersion TEXT NOT NULL,
          status TEXT NOT NULL,
          inputFingerprint TEXT,
          metadata TEXT
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS exceptions (
          id TEXT PRIMARY KEY,
          auditSessionId TEXT NOT NULL,
          transactionId TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT,
          auditTrail TEXT,
          metadata TEXT,
          FOREIGN KEY(auditSessionId) REFERENCES audit_sessions(id)
        );
      `);

      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }
}
