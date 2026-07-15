export enum PersistenceErrorCode {
  DATABASE_LOCKED = 'DATABASE_LOCKED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  MIGRATION_REQUIRED = 'MIGRATION_REQUIRED',
  IMMUTABILITY_VIOLATION = 'IMMUTABILITY_VIOLATION',
  DATABASE_CORRUPTED = 'DATABASE_CORRUPTED',
  READ_ONLY_VIOLATION = 'READ_ONLY_VIOLATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class PersistenceError extends Error {
  constructor(
    public readonly code: PersistenceErrorCode,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    const causeMessage = cause instanceof Error ? `: ${cause.message}` : '';
    super(`PersistenceError [${code}] during ${operation}${causeMessage}`);
    this.name = 'PersistenceError';
  }
}

/**
 * Translates raw SQLite errors (or JSON errors) into PersistenceError.
 */
export function translateSqliteError(operation: string, error: unknown): PersistenceError {
  if (error instanceof PersistenceError) {
    return error;
  }
  
  if (error instanceof SyntaxError) {
    return new PersistenceError(PersistenceErrorCode.SERIALIZATION_ERROR, operation, error);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('database is locked') || msg.includes('busy')) {
      return new PersistenceError(PersistenceErrorCode.DATABASE_LOCKED, operation, error);
    }
    if (msg.includes('constraint')) {
      return new PersistenceError(PersistenceErrorCode.CONSTRAINT_VIOLATION, operation, error);
    }
  }

  return new PersistenceError(PersistenceErrorCode.UNKNOWN_ERROR, operation, error);
}
