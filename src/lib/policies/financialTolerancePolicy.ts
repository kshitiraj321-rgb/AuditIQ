import { IAutonomousResolutionPolicy } from '../interfaces/exceptionInterfaces';
import { PolicyEvaluationContext, PolicyDecision } from '../types/exceptionLifecycle';

export class FinancialTolerancePolicy implements IAutonomousResolutionPolicy {
  public readonly id = 'FINANCIAL_TOLERANCE_POLICY';
  public readonly version = '1.0.0';
  public readonly priority = 10;

  evaluate(context: PolicyEvaluationContext): PolicyDecision {
    const { exceptionState, transactionState } = context;

    if (exceptionState.type !== 'Price Variance') {
      return {
        decision: 'IGNORE',
        reason: 'Policy only applies to Price Variance exceptions.',
        policyId: this.id,
        policyVersion: this.version
      };
    }

    // Extract the original data to check tolerance
    // Since ExceptionState doesn't store the raw values directly but refers to the transaction,
    // we can look at the transaction payloads (if available) or assume they are stored in exception metadata.
    // For this example, we'll check exceptionState.metadata for actual and expected values,
    // or fallback to checking the transaction.
    const metadata = exceptionState.metadata || {};
    const actualPrice = metadata.actualPrice || 0;
    const expectedPrice = metadata.expectedPrice || 0;

    const diff = Math.abs(actualPrice - expectedPrice);
    
    // Strict deterministic rule: if the difference is <= $5.00, we resolve it.
    if (diff <= 5.00 && diff > 0) {
      return {
        decision: 'RESOLVE',
        reason: `Price variance of $${diff.toFixed(2)} is within the $5.00 automated tolerance limit.`,
        policyId: this.id,
        policyVersion: this.version,
        metadata: { diff, limit: 5.00 }
      };
    }

    // Otherwise, escalate for manual review
    return {
      decision: 'MANUAL_REVIEW',
      reason: `Price variance of $${diff.toFixed(2)} exceeds the $5.00 automated tolerance limit.`,
      policyId: this.id,
      policyVersion: this.version,
      metadata: { diff, limit: 5.00 }
    };
  }
}
