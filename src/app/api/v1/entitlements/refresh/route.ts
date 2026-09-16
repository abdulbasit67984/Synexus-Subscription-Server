import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { authenticateMachine } from "@/lib/machine-auth";
import { issueEntitlement } from "@/lib/entitlements";
import { fail, ok } from "@/lib/http";
export async function POST(request: NextRequest) {
  await connectDb(); const body = await request.text(); const installation = await authenticateMachine(request, body);
  if (!installation) return fail("Invalid installation signature", 401);
  try { return ok(await issueEntitlement(String(installation._id))); } catch (error) { return fail(error instanceof Error ? error.message : "Refresh failed", 400); }
}
