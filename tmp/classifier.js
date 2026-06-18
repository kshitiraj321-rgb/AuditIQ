"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyDocument = classifyDocument;
var separatorPattern = "[\\s._-]+";
function escapeRegExp(rawValue) {
    return rawValue.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
function buildTokenRegex(token) {
    var tokenPattern = escapeRegExp(token)
        .replace(/\\ /g, separatorPattern)
        .replace(/\\-/g, separatorPattern)
        .replace(/\\_/g, separatorPattern);
    return new RegExp("(?:^|[^a-zA-Z0-9])(?:".concat(tokenPattern, ")(?:$|[^a-zA-Z0-9])"), "i");
}
function matchesToken(fileName, token) {
    return buildTokenRegex(token).test(fileName);
}
function matchesAnyToken(fileName, tokens) {
    return tokens.some(function (token) { return matchesToken(fileName, token); });
}
function getMatchedTokenConfidence(fileName, tokens) {
    // Find which token actually matched
    var matchedToken = tokens.find(function (token) { return matchesToken(fileName, token); });
    if (!matchedToken) {
        return 80; // fallback to medium if no token found (shouldn't happen)
    }
    // Single-word tokens (no hyphens, underscores, or multiple words): 95
    // Compound/long-form tokens: 80
    var hasCompoundCharacters = matchedToken.includes("-") ||
        matchedToken.includes("_") ||
        matchedToken.split(" ").length > 1;
    return hasCompoundCharacters ? 80 : 95;
}
function classifyDocument(fileName) {
    var name = fileName.toLowerCase();
    var purchaseOrderTokens = [
        "po",
        "purchase-order",
        "purchase_order",
        "purchase order",
        "p.o.",
    ];
    var grnTokens = [
        "grn",
        "goods-receipt",
        "goods_receipt",
        "goods receipt",
        "goods received note",
    ];
    var invoiceTokens = [
        "invoice",
        "inv",
        "vendor-invoice",
        "vendor_invoice",
        "tax-invoice",
        "tax_invoice",
    ];
    var matches = [
        { type: "Purchase Order", tokens: purchaseOrderTokens, matched: matchesAnyToken(name, purchaseOrderTokens) },
        { type: "Goods Receipt Note", tokens: grnTokens, matched: matchesAnyToken(name, grnTokens) },
        { type: "Vendor Invoice", tokens: invoiceTokens, matched: matchesAnyToken(name, invoiceTokens) },
    ];
    var matchedEntries = matches.filter(function (entry) { return entry.matched; });
    if (matchedEntries.length !== 1) {
        return { type: "Unknown", confidence: 0 };
    }
    var matchedEntry = matchedEntries[0];
    var confidence = getMatchedTokenConfidence(name, matchedEntry.tokens);
    return { type: matchedEntry.type, confidence: confidence };
}
