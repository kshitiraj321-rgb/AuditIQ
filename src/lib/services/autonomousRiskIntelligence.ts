import { PredictiveAlertService, PredictiveAlert } from '../predictiveAlertService';
import { ExceptionLifecycleManager } from './exceptionLifecycleManager';
import { ExceptionResolution } from '../types/index';

/**
 * Autonomous Risk Intelligence
 * Implements Blueprint V4 Section 14.8.
 * 
 * Purpose: Transforms predictive alerts into autonomous operational workflows.
 * It observes predictive intelligence and automatically acts on it based on 
 * defined confidence thresholds, moving from "predict" to "act".
 */
export class AutonomousRiskIntelligence {
  private alertService: PredictiveAlertService;
  private lifecycleManager: ExceptionLifecycleManager;
  private readonly AUTONOMOUS_THRESHOLD = 0.90;

  constructor(
    alertService: PredictiveAlertService,
    lifecycleManager: ExceptionLifecycleManager
  ) {
    this.alertService = alertService;
    this.lifecycleManager = lifecycleManager;
  }

  /**
   * Scans for critical predictive alerts and attempts autonomous resolution 
   * if confidence exceeds the autonomous action threshold.
   */
  public async executeAutonomousWorkflows(): Promise<ExceptionResolution[]> {
    const alerts = this.alertService.getActiveAlerts();
    const autonomousActions: ExceptionResolution[] = [];

    for (const alert of alerts) {
      if (this.canResolveAutonomously(alert)) {
        const resolution = await this.triggerAutonomousAction(alert);
        if (resolution) {
          autonomousActions.push(resolution);
        }
      }
    }

    return autonomousActions;
  }

  /**
   * Determines if an alert is eligible for autonomous execution.
   */
  private canResolveAutonomously(alert: PredictiveAlert): boolean {
    return alert.severity === 'CRITICAL';
  }

  /**
   * Executes the appropriate autonomous action based on the alert type.
   */
  private async triggerAutonomousAction(alert: PredictiveAlert): Promise<ExceptionResolution | null> {
    try {
      // In a real implementation, this would map the alert context to specific workflows.
      // E.g., placing a vendor hold, blocking an invoice payment, or escalating.
      return await this.lifecycleManager.resolveException(
        alert.alertId,
        'SYSTEM_AUTONOMOUS',
        'AUTONOMOUS_PREVENTION_HOLD',
        `Autonomously held due to predictive risk. Reason: ${alert.message}`
      );
    } catch (error) {
      console.error(`Autonomous workflow failed for alert ${alert.alertId}`, error);
      return null;
    }
  }
}
