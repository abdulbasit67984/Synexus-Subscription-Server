import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { AdminUser } from "@/lib/models";
import { clearAdminSession, createAdminSession } from "@/lib/admin-auth";
import { fail, ok } from "@/lib/http";
import { decryptSecret } from "@/lib/secret-box";
const schema = z.object({ email: z.string().email(), password: z.string().min(8), totp: z.string().length(6) });
export async function POST(request: Request) {
  try {
    await connectDb(); const input = schema.parse(await request.json()); const admin = await AdminUser.findOne({ email: input.email.toLowerCase(), active: true });
    if (!admin || (admin.lockedUntil && admin.lockedUntil > new Date()) || !await bcrypt.compare(input.password, admin.passwordHash) || !authenticator.check(input.totp, decryptSecret(admin.totpSecret))) {
      if (admin) { admin.failedLoginCount += 1; if (admin.failedLoginCount >= 5) admin.lockedUntil = new Date(Date.now() + 15 * 60_000); await admin.save(); }
      return fail("Invalid credentials", 401);
    }
    await createAdminSession(admin); admin.lastLoginAt = new Date(); admin.failedLoginCount = 0; admin.lockedUntil = null; await admin.save(); return ok({ id: admin._id, name: admin.name, role: admin.role });
  } catch { return fail("Invalid credentials", 401); }
}
export async function DELETE() { await clearAdminSession(); return ok({}); }
