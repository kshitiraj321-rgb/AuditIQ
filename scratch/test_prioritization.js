"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prioritizationEngine_1 = require("../src/lib/prioritizationEngine");
var exceptionRisk_1 = require("../src/lib/exceptionRisk");
var financialExposure_1 = require("../src/lib/financialExposure");
var exceptionEngine_1 = require("../src/lib/exceptionEngine");
var matcher_1 = require("../src/lib/matcher");
var extractor_1 = require("../src/lib/extractor");
var poData = (0, extractor_1.extractDocumentData)("Purchase Order", "", null);
var grnData = (0, extractor_1.extractDocumentData)("Goods Receipt Note", "", null);
var invData = (0, extractor_1.extractDocumentData)("Vendor Invoice", "", null);
var matchResult = (0, matcher_1.matchDocuments)({
    purchaseOrder: poData,
    goodsReceiptNote: grnData,
    vendorInvoice: invData,
});
var exceptions = (0, exceptionEngine_1.detectExceptions)({
    purchaseOrder: poData,
    goodsReceiptNote: grnData,
    vendorInvoice: invData,
    matchResult: matchResult,
    existingInvoices: [],
});
var financialExposure = (0, financialExposure_1.calculateFinancialExposure)({
    purchaseOrder: poData,
    goodsReceiptNote: grnData,
    vendorInvoice: invData,
    exceptions: exceptions,
});
var risks = (0, exceptionRisk_1.calculateExceptionRisks)(exceptions, financialExposure);
var prioritizedQueue = (0, prioritizationEngine_1.prioritizeExceptions)(exceptions, risks, invData);
console.log(JSON.stringify(prioritizedQueue, null, 2));
