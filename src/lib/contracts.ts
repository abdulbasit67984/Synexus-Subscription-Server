export const BILLING_TYPES = ["monthly", "annual", "perpetual", "complimentary"] as const;
export const SUBSCRIPTION_STATUSES = ["active", "grace", "expired", "suspended", "legacy_unmanaged"] as const;
export const PAYMENT_STATUSES = ["pending", "successful", "failed", "cancelled", "expired", "reversed", "payment_review"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function addContractTerm(base: Date, billingType: BillingType, terms = 1) {
  const result = new Date(base);
  const originalDay = result.getUTCDate();
  if (billingType === "monthly" || billingType === "complimentary") {
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + terms);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
  } else if (billingType === "annual") {
    const originalMonth = result.getUTCMonth();
    result.setUTCDate(1);
    result.setUTCFullYear(result.getUTCFullYear() + terms);
    result.setUTCMonth(originalMonth);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), originalMonth + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
  }
  else throw new Error("Perpetual contracts do not have renewal terms");
  return result;
}

export function calculatePaidThrough(current: Date | null, paidAt: Date, billingType: BillingType, terms = 1) {
  const base = current && current > paidAt ? current : paidAt;
  return addContractTerm(base, billingType, terms);
}

export function deriveStatus(input: { billingType: BillingType; configuredStatus?: SubscriptionStatus; paidThrough?: Date | null }, now = new Date()): SubscriptionStatus {
  if (input.configuredStatus === "suspended" || input.configuredStatus === "legacy_unmanaged") return input.configuredStatus;
  if (input.billingType === "perpetual") return "active";
  if (!input.paidThrough || input.paidThrough.getTime() < now.getTime()) return "expired";
  return "active";
}
