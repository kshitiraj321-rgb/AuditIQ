import { createConnection } from '../../src/lib/persistence/connection';
import { MigrationRunner } from '../../src/lib/persistence/migrationRunner';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('--- Testing :memory: DB ---');
  const memDb = createConnection();
  const memRunner = new MigrationRunner(memDb);
  
  console.log('Initial user_version:', memDb.prepare('PRAGMA user_version;').get());
  
  console.log('Running initial migration...');
  memRunner.runMigrations();
  console.log('user_version after migration:', memDb.prepare('PRAGMA user_version;').get());
  
  const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
  console.log('Tables created:', tables);
  
  console.log('Running migration again (should be no-op)...');
  memRunner.runMigrations();
  console.log('user_version after second run:', memDb.prepare('PRAGMA user_version;').get());
  memDb.close();

  console.log('\n--- Testing persistent DB ---');
  const persistentPath = path.join(__dirname, 'test.db');
  if (fs.existsSync(persistentPath)) {
    fs.unlinkSync(persistentPath);
  }
  
  const fileDb = createConnection({ dbPath: persistentPath });
  const fileRunner = new MigrationRunner(fileDb);
  
  console.log('Running migration on file DB...');
  fileRunner.runMigrations();
  console.log('user_version on file DB:', fileDb.prepare('PRAGMA user_version;').get());
  fileDb.close();
  
  if (fs.existsSync(persistentPath)) {
    console.log('Persistent DB file created successfully.');
    fs.unlinkSync(persistentPath); // cleanup
  }
}

runTests();
