export const analysisStorageKey = "auditIQAnalysis";
export const auditedInvoicesStorageKey = "auditiq_audited_invoices";

export function startFreshAuditSession() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(analysisStorageKey);
  window.localStorage.removeItem(auditedInvoicesStorageKey);
}
