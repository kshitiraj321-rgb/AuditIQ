import * as assert from 'node:assert';
import { SAPAdapter } from './sapAdapter';

async function runTests() {
  console.log('Running SAPAdapter tests...');
  const adapter = new SAPAdapter();

  // Test 1: Translation
  const mockSapPayload = {
    BELNR: '0000001234',
    LIFNR: 'V1000',
    KOSTL: 'D500',
    WRBTR: '450.50',
    WAERS: 'EUR',
    BUDAT: '2026-07-12T00:00:00.000Z',
    BLART: 'RE'
  };

  const tx = adapter.ingestTransaction(mockSapPayload);
  assert.strictEqual(tx.id, '0000001234');
  assert.strictEqual(tx.vendorId, 'V1000');
  assert.strictEqual(tx.departmentId, 'D500');
  assert.strictEqual(tx.amount, 450.50);
  assert.strictEqual(tx.currency, 'EUR');
  assert.strictEqual(tx.date, '2026-07-12T00:00:00.000Z');
  assert.strictEqual(tx.metadata?.sourceSystem, 'SAP_S4HANA');
  console.log('✔ should translate SAP IDoc to canonical Transaction');

  // Test 2: Connection
  assert.strictEqual(adapter.checkConnection(), true);
  console.log('✔ should verify connection');
  
  console.log('SAPAdapter tests passed.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
