"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectExceptions = detectExceptions;
var timelineValidator_1 = require("@/lib/timelineValidator");
function addException(exceptions, type, message) {
    exceptions.push(__assign({ type: type, severity: "High" }, (message ? { message: message } : {})));
}
function detectExceptions(_a) {
    var _b, _c, _d, _e, _f;
    var purchaseOrder = _a.purchaseOrder, goodsReceiptNote = _a.goodsReceiptNote, vendorInvoice = _a.vendorInvoice, matchResult = _a.matchResult, _g = _a.existingInvoices, existingInvoices = _g === void 0 ? [] : _g;
    var exceptions = [];
    if (!vendorInvoice) {
        addException(exceptions, "Missing Invoice");
        return exceptions;
    }
    if (!goodsReceiptNote) {
        addException(exceptions, "Missing GRN");
        return exceptions;
    }
    if (!matchResult.quantityMatch.matched) {
        addException(exceptions, "Quantity Mismatch");
    }
    if (!matchResult.priceMatch.matched) {
        addException(exceptions, "Price Variance");
    }
    if (vendorInvoice) {
        var invoiceNum_1 = (_b = vendorInvoice.invoiceNumber) !== null && _b !== void 0 ? _b : vendorInvoice.documentNumber;
        var vendorName_1 = (_c = vendorInvoice.vendorName) !== null && _c !== void 0 ? _c : vendorInvoice.vendor;
        if (invoiceNum_1 && vendorName_1) {
            var isDuplicate = existingInvoices.some(function (inv) {
                return inv.vendorName.trim().toUpperCase() === vendorName_1.trim().toUpperCase() &&
                    inv.invoiceNumber.trim().toUpperCase() === invoiceNum_1.trim().toUpperCase();
            });
            if (isDuplicate) {
                addException(exceptions, "Duplicate Invoice");
            }
        }
    }
    var timelineResult = (0, timelineValidator_1.validateTimeline)(purchaseOrder ? { normalizedDate: (_d = purchaseOrder.normalizedDate) !== null && _d !== void 0 ? _d : null } : null, goodsReceiptNote ? { normalizedDate: (_e = goodsReceiptNote.normalizedDate) !== null && _e !== void 0 ? _e : null } : null, vendorInvoice ? { normalizedDate: (_f = vendorInvoice.normalizedDate) !== null && _f !== void 0 ? _f : null } : null);
    if (!timelineResult.isValid) {
        addException(exceptions, "Timeline Deviation", timelineResult.errors.join("; "));
    }
    return exceptions;
}
