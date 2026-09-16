import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "pandas_admin_session";
const secret = () => {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return process.env.SESSION_SECRET;
};
const signature = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export async function createAdminSession(admin: { _id: unknown; role: string }) {
  const body = Buffer.from(JSON.stringify({ sub: String(admin._id), role: admin.role, exp: Date.now() + 8 * 60 * 60_000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${signature(body)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
}

export async function getAdminSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [body, supplied] = token.split(".");
  if (!body || !supplied) return null;
  const expected = signature(body);
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  const session = JSON.parse(Buffer.from(body, "base64url").toString()) as { sub: string; role: string; exp: number };
  return session.exp > Date.now() ? session : null;
}

export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
