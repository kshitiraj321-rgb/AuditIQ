"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchDocuments = matchDocuments;
function compareField(purchaseOrderValue, goodsReceiptNoteValue, vendorInvoiceValue) {
    var matched = purchaseOrderValue !== null &&
        goodsReceiptNoteValue !== null &&
        vendorInvoiceValue !== null &&
        purchaseOrderValue === goodsReceiptNoteValue &&
        purchaseOrderValue === vendorInvoiceValue;
    return {
        matched: matched,
        po: purchaseOrderValue,
        grn: goodsReceiptNoteValue,
        invoice: vendorInvoiceValue,
    };
}
function normalizeIdentifier(val) {
    if (!val)
        return null;
    var cleaned = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return cleaned || null;
}
function comparePOIdentifiers(po, grn, invoice) {
    var normPo = normalizeIdentifier(po);
    var normGrn = normalizeIdentifier(grn);
    var normInvoice = normalizeIdentifier(invoice);
    var matched = normPo !== null &&
        normGrn !== null &&
        normInvoice !== null &&
        normPo === normGrn &&
        normPo === normInvoice;
    return {
        matched: matched,
        po: po,
        grn: grn,
        invoice: invoice,
        normalizedPo: normPo,
        normalizedGrn: normGrn,
        normalizedInvoice: normInvoice,
    };
}
function compareGRNIdentifiers(po, grn, invoice) {
    var normGrn = normalizeIdentifier(grn);
    var normInvoice = normalizeIdentifier(invoice);
    var matched = normGrn !== null &&
        normInvoice !== null &&
        normGrn === normInvoice;
    return {
        matched: matched,
        po: null,
        grn: grn,
        invoice: invoice,
        normalizedPo: null,
        normalizedGrn: normGrn,
        normalizedInvoice: normInvoice,
    };
}
function matchDocuments(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    var purchaseOrder = _a.purchaseOrder, goodsReceiptNote = _a.goodsReceiptNote, vendorInvoice = _a.vendorInvoice;
    return {
        quantityMatch: compareField((_b = purchaseOrder === null || purchaseOrder === void 0 ? void 0 : purchaseOrder.quantity) !== null && _b !== void 0 ? _b : null, (_c = goodsReceiptNote === null || goodsReceiptNote === void 0 ? void 0 : goodsReceiptNote.quantity) !== null && _c !== void 0 ? _c : null, (_d = vendorInvoice === null || vendorInvoice === void 0 ? void 0 : vendorInvoice.quantity) !== null && _d !== void 0 ? _d : null),
        priceMatch: compareField((_e = purchaseOrder === null || purchaseOrder === void 0 ? void 0 : purchaseOrder.unitPrice) !== null && _e !== void 0 ? _e : null, (_f = goodsReceiptNote === null || goodsReceiptNote === void 0 ? void 0 : goodsReceiptNote.unitPrice) !== null && _f !== void 0 ? _f : null, (_g = vendorInvoice === null || vendorInvoice === void 0 ? void 0 : vendorInvoice.unitPrice) !== null && _g !== void 0 ? _g : null),
        amountMatch: compareField((_h = purchaseOrder === null || purchaseOrder === void 0 ? void 0 : purchaseOrder.amount) !== null && _h !== void 0 ? _h : null, (_j = goodsReceiptNote === null || goodsReceiptNote === void 0 ? void 0 : goodsReceiptNote.amount) !== null && _j !== void 0 ? _j : null, (_k = vendorInvoice === null || vendorInvoice === void 0 ? void 0 : vendorInvoice.amount) !== null && _k !== void 0 ? _k : null),
        poNumberMatch: comparePOIdentifiers((_l = purchaseOrder === null || purchaseOrder === void 0 ? void 0 : purchaseOrder.poNumber) !== null && _l !== void 0 ? _l : null, (_m = goodsReceiptNote === null || goodsReceiptNote === void 0 ? void 0 : goodsReceiptNote.poNumber) !== null && _m !== void 0 ? _m : null, (_o = vendorInvoice === null || vendorInvoice === void 0 ? void 0 : vendorInvoice.poNumber) !== null && _o !== void 0 ? _o : null),
        grnNumberMatch: compareGRNIdentifiers((_p = purchaseOrder === null || purchaseOrder === void 0 ? void 0 : purchaseOrder.grnNumber) !== null && _p !== void 0 ? _p : null, (_q = goodsReceiptNote === null || goodsReceiptNote === void 0 ? void 0 : goodsReceiptNote.grnNumber) !== null && _q !== void 0 ? _q : null, (_r = vendorInvoice === null || vendorInvoice === void 0 ? void 0 : vendorInvoice.grnNumber) !== null && _r !== void 0 ? _r : null),
    };
}
