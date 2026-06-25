"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFinancialExposure = calculateFinancialExposure;
function addBreakdownItem(breakdown, exception, exposure) {
    breakdown.push({
        exception: exception,
        exposure: exposure,
    });
}
function calculateFinancialExposure(_a) {
    var purchaseOrder = _a.purchaseOrder, goodsReceiptNote = _a.goodsReceiptNote, vendorInvoice = _a.vendorInvoice, exceptions = _a.exceptions;
    var breakdown = [];
    for (var _i = 0, exceptions_1 = exceptions; _i < exceptions_1.length; _i++) {
        var exception = exceptions_1[_i];
        if (exception.type === "Quantity Mismatch" && purchaseOrder && goodsReceiptNote) {
            addBreakdownItem(breakdown, exception.type, Math.abs(purchaseOrder.quantity - goodsReceiptNote.quantity) *
                purchaseOrder.unitPrice);
            continue;
        }
        if (exception.type === "Price Variance" && purchaseOrder && vendorInvoice) {
            addBreakdownItem(breakdown, exception.type, purchaseOrder.quantity * Math.abs(vendorInvoice.unitPrice - purchaseOrder.unitPrice));
            continue;
        }
        if (exception.type === "Missing Invoice" && purchaseOrder) {
            addBreakdownItem(breakdown, exception.type, purchaseOrder.totalAmount);
            continue;
        }
        if (exception.type === "Missing GRN" && vendorInvoice) {
            addBreakdownItem(breakdown, exception.type, vendorInvoice.totalAmount);
            continue;
        }
        if (exception.type === "Duplicate Invoice" && vendorInvoice) {
            addBreakdownItem(breakdown, exception.type, vendorInvoice.totalAmount);
        }
    }
    return {
        totalExposure: breakdown.reduce(function (sum, item) { return sum + item.exposure; }, 0),
        breakdown: breakdown,
    };
}
