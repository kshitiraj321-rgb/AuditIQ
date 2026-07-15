import * as assert from 'node:assert';
import { AutonomousRiskIntelligence } from './autonomousRiskIntelligence';
import { PredictiveAlertService, PredictiveAlert } from '../predictiveAlertService';
import { ExceptionLifecycleManager } from './exceptionLifecycleManager';
import { ExceptionResolution } from '../types/index';

async function runTests() {
  console.log('Running AutonomousRiskIntelligence tests...');

  // Mock Dependencies
  const mockAlertService = {
    getActiveAlerts: () => [] as PredictiveAlert[]
  } as unknown as PredictiveAlertService;

  const mockLifecycleManager = {
    resolveException: async () => ({} as ExceptionResolution)
  } as unknown as ExceptionLifecycleManager;

  const intelligence = new AutonomousRiskIntelligence(mockAlertService, mockLifecycleManager);

  // Test 1: Ignore below threshold
  mockAlertService.getActiveAlerts = () => [
    { alertId: 'alert-1', transactionId: 'tx-1', severity: 'HIGH', message: 'Test message', timestamp: new Date().toISOString() }
  ];
  let resolveCalled = false;
  mockLifecycleManager.resolveException = async () => { resolveCalled = true; return {} as ExceptionResolution; };
  
  let resolutions = await intelligence.executeAutonomousWorkflows();
  assert.strictEqual(resolutions.length, 0);
  assert.strictEqual(resolveCalled, false);
  console.log('✔ should ignore alerts below autonomous threshold');

  // Test 2: Execute high confidence
  mockAlertService.getActiveAlerts = () => [
    { alertId: 'alert-2', transactionId: 'tx-2', severity: 'CRITICAL', message: 'Critical message', timestamp: new Date().toISOString() }
  ];
  const expectedResolution: ExceptionResolution = {
    exceptionId: 'alert-2',
    transactionId: 'tx-123',
    resolutionType: 'AUTONOMOUS_PREVENTION_HOLD',
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'SYSTEM_AUTONOMOUS',
    notes: 'Autonomously held due to predictive risk. Reason: Critical message'
  };
  
  let calledWith: any[] = [];
  mockLifecycleManager.resolveException = async (...args) => {
    calledWith = args;
    return expectedResolution;
  };

  resolutions = await intelligence.executeAutonomousWorkflows();
  assert.strictEqual(resolutions.length, 1);
  assert.strictEqual(calledWith[0], 'alert-2');
  assert.strictEqual(calledWith[1], 'SYSTEM_AUTONOMOUS');
  assert.strictEqual(calledWith[2], 'AUTONOMOUS_PREVENTION_HOLD');
  console.log('✔ should execute autonomous workflow for high-confidence critical alerts');

  console.log('AutonomousRiskIntelligence tests passed.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
