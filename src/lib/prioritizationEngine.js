"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prioritizeExceptions = prioritizeExceptions;
var COMPLIANCE_WEIGHTS = {
    "Duplicate Invoice": 100,
    "Missing Invoice": 80,
    "Missing GRN": 60,
    "Price Variance": 40,
    "Quantity Mismatch": 40,
    "Timeline Deviation": 20,
};
var VENDOR_MOCK_REGISTRY = {
    "TechCorp": 5,
    "Global Supplies": 4,
    "ABC Industries": 3, // In fixture data, vendor is ABC Industries
    "ABC Manufacturing": 3,
};
function prioritizeExceptions(exceptions, exceptionRisks, vendorInvoiceData) {
    var vendorName = (vendorInvoiceData === null || vendorInvoiceData === void 0 ? void 0 : vendorInvoiceData.vendorName) || "";
    var totalAmount = (vendorInvoiceData === null || vendorInvoiceData === void 0 ? void 0 : vendorInvoiceData.totalAmount) || 0;
    var vendorMultiplier = VENDOR_MOCK_REGISTRY[vendorName] || 1;
    var transactionScore = 0;
    if (totalAmount > 100000)
        transactionScore = 30;
    else if (totalAmount > 50000)
        transactionScore = 20;
    else if (totalAmount > 10000)
        transactionScore = 10;
    var prioritizedQueue = exceptions.map(function (ex) {
        var riskData = exceptionRisks.find(function (r) { return r.type === ex.type; });
        var baseRiskScore = riskData ? riskData.score : 0;
        var complianceScore = COMPLIANCE_WEIGHTS[ex.type] || 0;
        var vendorScore = vendorMultiplier * 10;
        var finalPriorityScore = baseRiskScore + complianceScore + vendorScore + transactionScore;
        return {
            exception: ex,
            baseRiskScore: baseRiskScore,
            complianceScore: complianceScore,
            vendorScore: vendorScore,
            transactionScore: transactionScore,
            finalPriorityScore: finalPriorityScore,
        };
    });
    prioritizedQueue.sort(function (a, b) { return b.finalPriorityScore - a.finalPriorityScore; });
    return prioritizedQueue;
}
