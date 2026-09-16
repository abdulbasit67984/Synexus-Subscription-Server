import { getAdminSession } from "@/lib/admin-auth";
import { connectDb } from "@/lib/db";
import { randomCode, sha256 } from "@/lib/crypto";
import { ActivationCode, Business } from "@/lib/models";
import { addDays } from "@/lib/time";
import { fail, ok } from "@/lib/http";
export async function POST(_: Request, context: { params: Promise<{ businessId: string }> }) {
  const admin = await getAdminSession(); if (!admin || admin.role === "viewer") return fail("Forbidden", 403);
  await connectDb(); const { businessId } = await context.params; if (!await Business.exists({ _id: businessId })) return fail("Business not found", 404);
  const code = randomCode(); await ActivationCode.create({ codeHash: sha256(code), businessId, expiresAt: addDays(new Date(), 7), createdBy: admin.sub });
  return ok({ activationCode: code, expiresAt: addDays(new Date(), 7) }, 201);
}
