import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { calculatePaidThrough } from "@/lib/contracts";
import { connectDb } from "@/lib/db";
import { Business, SubscriptionEvent } from "@/lib/models";
import { fail, ok } from "@/lib/http";
import { withMongoTransaction } from "@/lib/transaction";
const schema = z.object({ terms: z.number().int().min(1).max(12), reason: z.string().min(3), complimentary: z.boolean().default(false) });
export async function POST(request: Request, context: { params: Promise<{ businessId: string }> }) {
  const admin = await getAdminSession(); if (!admin || admin.role === "viewer") return fail("Forbidden", 403);
  await connectDb(); const input = schema.parse(await request.json()); const { businessId } = await context.params;
  try {
    const result = await withMongoTransaction(async (session) => {
      const business = await Business.findById(businessId).session(session); if (!business) throw new Error("Business not found");
      if (business.billingType === "perpetual") throw new Error("Perpetual licenses do not need renewal");
      const before = business.paidThrough; business.paidThrough = calculatePaidThrough(before, new Date(), business.billingType as never, input.terms); business.configuredStatus = "active"; await business.save({ session });
      await SubscriptionEvent.create([{ businessId, type: input.complimentary ? "complimentary_renewal" : "manual_renewal", actorType: "admin", actorId: admin.sub, reason: input.reason, before: { paidThrough: before }, after: { paidThrough: business.paidThrough }, metadata: { terms: input.terms } }], { session: session || undefined });
      return business;
    }); return ok(result);
  } catch (error) { return fail(error instanceof Error ? error.message : "Renewal failed", 400); }
}
