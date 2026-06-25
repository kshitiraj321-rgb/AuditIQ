"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExceptionRisks = calculateExceptionRisks;
function calculateExceptionRisks(exceptions, financialExposure) {
    return exceptions.map(function (ex) {
        var baseScore = 50;
        if (ex.severity === "High") {
            baseScore = 75;
        }
        var breakdown = financialExposure.breakdown.find(function (b) { return b.exception === ex.type; });
        var exposure = breakdown ? breakdown.exposure : 0;
        var score = baseScore;
        if (exposure > 25000) {
            score += 20;
        }
        else if (exposure > 10000) {
            score += 15;
        }
        else if (exposure > 5000) {
            score += 10;
        }
        return {
            type: ex.type,
            score: Math.min(score, 100),
        };
    });
}
