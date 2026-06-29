// ============================================================================
// Predictive Alert Service - Blueprint V3, Section 13.7
// ============================================================================
// Responsible for proactive warnings based on exception and risk predictions.
// ============================================================================

import { PredictiveRiskAssessment, PredictionReason } from './predictiveRiskEngine';

export interface PredictiveAlert {
  alertId: string;
  transactionId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  timestamp: string;
}

export class PredictiveAlertService {
  private activeAlerts: PredictiveAlert[] = [];

  /**
   * Processes a new predictive risk assessment and dispatches proactive warnings if needed.
   */
  public dispatchAlerts(assessment: PredictiveRiskAssessment): void {
    if (assessment.riskLevel === "CRITICAL" || assessment.riskLevel === "HIGH") {
      
      const reasonsText = assessment.reasons.map(r => r.description).join(" ");
      
      const newAlert: PredictiveAlert = {
        alertId: `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        transactionId: assessment.transactionId,
        severity: assessment.riskLevel,
        message: `PROACTIVE WARNING: Transaction ${assessment.transactionId} flagged as ${assessment.riskLevel} risk. ${reasonsText}`,
        timestamp: new Date().toISOString()
      };

      this.activeAlerts.push(newAlert);
      
      // In a production environment, this would push to an event bus or email service
      console.warn(`[PredictiveAlertService] ${newAlert.message}`);
    }
  }

  public getActiveAlerts(): PredictiveAlert[] {
    return [...this.activeAlerts];
  }
}
