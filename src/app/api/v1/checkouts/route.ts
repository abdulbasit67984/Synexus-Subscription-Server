import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { authenticateMachine } from "@/lib/machine-auth";
import { Business, PaymentOrder, Plan } from "@/lib/models";
import { paymentProvider } from "@/lib/payment-provider";
import { addDays } from "@/lib/time";
import { fail, ok } from "@/lib/http";
export async function POST(request: NextRequest) {
  await connectDb(); const body = await request.text(); const installation = await authenticateMachine(request, body);
  if (!installation) return fail("Invalid installation signature", 401);
  const business = await Business.findById(installation.businessId); const plan = business && await Plan.findOne({ key: business.planKey });
  if (!business || !plan) return fail("Business plan is not configured", 409);
  if (!["monthly", "annual"].includes(business.billingType)) return fail("This agreement is not self-renewable", 409);
  const amount = business.negotiatedPrice ?? (business.billingType === "annual" ? plan.annualPrice : plan.monthlyPrice);
  const orderId = `PANDAS-${randomUUID()}`; const expiresAt = addDays(new Date(), 1);
  await PaymentOrder.create({ orderId, businessId: business._id, billingType: business.billingType, amount, expiresAt, terms: 1 });
  try {
    const checkout = await paymentProvider.createCheckout({ orderId, amount, returnUrl: `${process.env.APP_URL}/payment-result?orderId=${encodeURIComponent(orderId)}` });
    return ok({ orderId, amount, currency: "PKR", expiresAt, checkoutUrl: checkout.redirectUrl }, 201);
  } catch (error) { await PaymentOrder.updateOne({ orderId }, { status: "failed" }); return fail(error instanceof Error ? error.message : "Checkout unavailable", 503); }
}
