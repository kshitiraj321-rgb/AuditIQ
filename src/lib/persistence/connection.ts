import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';
import * as fs from 'fs';

export interface DatabaseConfig {
  /**
   * The path to the SQLite database file, or ':memory:' for an in-memory database.
   */
  dbPath?: string;
}

export function createConnection(config?: DatabaseConfig): DatabaseSync {
  const dbPath = config?.dbPath || process.env.DB_PATH || ':memory:';

  // Ensure directories exist if using a file-based path
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // DatabaseSync handles the actual connection. 
  return new DatabaseSync(dbPath);
}
