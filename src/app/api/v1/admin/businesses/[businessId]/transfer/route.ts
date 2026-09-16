import { getAdminSession } from "@/lib/admin-auth";
import { connectDb } from "@/lib/db";
import { randomCode, sha256 } from "@/lib/crypto";
import { ActivationCode, Business, Installation, SubscriptionEvent } from "@/lib/models";
import { addDays } from "@/lib/time";
import { fail, ok } from "@/lib/http";
import { withMongoTransaction } from "@/lib/transaction";

export async function POST(request: Request, context: { params: Promise<{ businessId: string }> }) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "owner") return fail("Owner access required", 403);
  const { reason } = await request.json();
  if (String(reason || "").trim().length < 3) return fail("A transfer reason is required", 400);
  await connectDb();
  const { businessId } = await context.params;
  const code = randomCode();
  try {
    await withMongoTransaction(async (session) => {
      const business = await Business.findById(businessId).session(session);
      if (!business) throw new Error("Business not found");
      const options = { session: session || undefined };
      await Installation.updateMany({ businessId, status: "active" }, { $set: { status: "revoked" } }, options);
      business.activeInstallationId = null;
      await business.save(options);
      await ActivationCode.create([{ codeHash: sha256(code), businessId, expiresAt: addDays(new Date(), 7), createdBy: admin.sub }], options);
      await SubscriptionEvent.create([{ businessId, type: "installation_transfer", actorType: "admin", actorId: admin.sub, reason }], options);
    });
    return ok({ activationCode: code, expiresAt: addDays(new Date(), 7) }, 201);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Transfer failed", 400);
  }
}
