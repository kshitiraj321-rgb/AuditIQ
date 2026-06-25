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
exports.extractionProvenance = void 0;
exports.normalizeDate = normalizeDate;
exports.extractDocumentData = extractDocumentData;
exports.extractionProvenance = new WeakMap();
var fixtureData = {
    "Purchase Order": {
        vendor: "ABC Industries",
        documentNumber: "PO-1001",
        date: "2026-06-12",
        quantity: 100,
        unitPrice: 500,
        amount: 50000,
    },
    "Goods Receipt Note": {
        vendor: "ABC Industries",
        documentNumber: "GRN-1001",
        date: "2026-06-12",
        quantity: 95,
        unitPrice: 500,
        amount: 47500,
    },
    "Vendor Invoice": {
        vendor: "ABC Industries",
        documentNumber: "INV-1001",
        date: "2026-06-12",
        quantity: 100,
        unitPrice: 620,
        amount: 62000,
    },
};
function getFixtureData(documentType) {
    var _a;
    return (_a = fixtureData[documentType]) !== null && _a !== void 0 ? _a : null;
}
var MONTH_NAMES = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
};
function padTwo(n) {
    return String(n).padStart(2, "0");
}
function toIsoDate(year, month, day) {
    if (month < 1 || month > 12)
        return null;
    if (day < 1 || day > 31)
        return null;
    if (year < 1900 || year > 2099)
        return null;
    return "".concat(year, "-").concat(padTwo(month), "-").concat(padTwo(day));
}
function normalizeDate(rawDate) {
    if (!rawDate)
        return null;
    var cleaned = rawDate.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    var iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso)
        return toIsoDate(parseInt(iso[1], 10), parseInt(iso[2], 10), parseInt(iso[3], 10));
    var yyyySlash = cleaned.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (yyyySlash)
        return toIsoDate(parseInt(yyyySlash[1], 10), parseInt(yyyySlash[2], 10), parseInt(yyyySlash[3], 10));
    var ddSlash = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddSlash)
        return toIsoDate(parseInt(ddSlash[3], 10), parseInt(ddSlash[2], 10), parseInt(ddSlash[1], 10));
    var ddHyphen = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddHyphen)
        return toIsoDate(parseInt(ddHyphen[3], 10), parseInt(ddHyphen[2], 10), parseInt(ddHyphen[1], 10));
    var ddDot = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddDot)
        return toIsoDate(parseInt(ddDot[3], 10), parseInt(ddDot[2], 10), parseInt(ddDot[1], 10));
    var ddMon = cleaned.match(/^(\d{1,2})[\s-]([a-zA-Z]+)[\s-](\d{4})$/);
    if (ddMon) {
        var d = parseInt(ddMon[1], 10);
        var m = MONTH_NAMES[ddMon[2].toLowerCase()];
        if (m)
            return toIsoDate(parseInt(ddMon[3], 10), parseInt(m, 10), d);
    }
    var monDd = cleaned.match(/^([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})$/);
    if (monDd) {
        var m = MONTH_NAMES[monDd[1].toLowerCase()];
        if (m)
            return toIsoDate(parseInt(monDd[3], 10), parseInt(m, 10), parseInt(monDd[2], 10));
    }
    return null;
}
function extractDocumentData(documentType, documentText, aiData) {
    void documentText; // retained for future OCR/local extraction use
    var fixture = getFixtureData(documentType);
    if (!fixture) {
        return null;
    }
    var resolvedAiData = aiData !== null && aiData !== void 0 ? aiData : null;
    var getField = function (key, fallback) {
        var aiValue = resolvedAiData ? resolvedAiData[key] : null;
        var isPresent = aiValue !== null && aiValue !== undefined;
        var finalValue = isPresent ? aiValue : fallback;
        var source;
        if (isPresent) {
            source = "extracted";
        }
        else if (finalValue !== null && finalValue !== undefined) {
            source = "fallback";
        }
        else {
            source = "missing";
        }
        return { value: finalValue, source: source };
    };
    var vendorRes = getField("vendor", fixture.vendor);
    var vendorNameRes = getField("vendorName", fixture.vendor);
    var poDocNumFallback = documentType === "Purchase Order" ? fixture.documentNumber : null;
    var grnDocNumFallback = documentType === "Goods Receipt Note" ? fixture.documentNumber : null;
    var invDocNumFallback = documentType === "Vendor Invoice" ? fixture.documentNumber : null;
    var docNumRes = getField("documentNumber", fixture.documentNumber);
    var poNumRes = getField("poNumber", poDocNumFallback);
    var grnNumRes = getField("grnNumber", grnDocNumFallback);
    var invNumRes = getField("invoiceNumber", invDocNumFallback);
    var dateRes = getField("date", fixture.date);
    var normDateRes = getField("normalizedDate", normalizeDate(fixture.date));
    var qtyRes = getField("quantity", fixture.quantity);
    var priceRes = getField("unitPrice", fixture.unitPrice);
    var amountRes = getField("amount", fixture.amount);
    var totalRes = getField("totalAmount", amountRes.value);
    var result = __assign(__assign({}, fixture), { vendor: vendorRes.value, vendorName: vendorNameRes.value, documentNumber: docNumRes.value, poNumber: poNumRes.value, grnNumber: grnNumRes.value, invoiceNumber: invNumRes.value, date: dateRes.value, normalizedDate: normDateRes.value, quantity: qtyRes.value, unitPrice: priceRes.value, amount: amountRes.value, totalAmount: totalRes.value });
    exports.extractionProvenance.set(result, {
        vendor: vendorRes.source,
        vendorName: vendorNameRes.source,
        documentNumber: docNumRes.source,
        poNumber: poNumRes.source,
        grnNumber: grnNumRes.source,
        invoiceNumber: invNumRes.source,
        date: dateRes.source,
        normalizedDate: normDateRes.source,
        quantity: qtyRes.source,
        unitPrice: priceRes.source,
        amount: amountRes.source,
        totalAmount: totalRes.source,
    });
    return result;
}
