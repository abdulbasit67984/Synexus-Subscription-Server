import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { paymentProvider } from "@/lib/payment-provider";
import { applyPaymentNotification } from "@/lib/payments";
export async function POST(request: NextRequest) {
  try { await connectDb(); const body = await request.text(); const event = await paymentProvider.parseNotification(body, request.headers.get("x-easypaisa-signature")); return ok(await applyPaymentNotification(event)); }
  catch (error) { return fail(error instanceof Error ? error.message : "Callback rejected", 400); }
}
