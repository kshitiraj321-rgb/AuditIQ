import { prioritizeExceptions } from "../src/lib/prioritizationEngine";
import { calculateExceptionRisks } from "../src/lib/exceptionRisk";
import { calculateFinancialExposure } from "../src/lib/financialExposure";
import { detectExceptions } from "../src/lib/exceptionEngine";
import { matchDocuments } from "../src/lib/matcher";
import { extractDocumentData } from "../src/lib/extractor";

const poData = extractDocumentData("Purchase Order", "", null);
const grnData = extractDocumentData("Goods Receipt Note", "", null);
const invData = extractDocumentData("Vendor Invoice", "", null);

const matchResult = matchDocuments({
  purchaseOrder: poData,
  goodsReceiptNote: grnData,
  vendorInvoice: invData,
});

const exceptions = detectExceptions({
  purchaseOrder: poData,
  goodsReceiptNote: grnData,
  vendorInvoice: invData,
  matchResult,
  existingInvoices: [],
});

const financialExposure = calculateFinancialExposure({
  purchaseOrder: poData,
  goodsReceiptNote: grnData,
  vendorInvoice: invData,
  exceptions,
});

const risks = calculateExceptionRisks(exceptions, financialExposure);

const prioritizedQueue = prioritizeExceptions(exceptions, risks, invData!);

console.log(JSON.stringify(prioritizedQueue, null, 2));
