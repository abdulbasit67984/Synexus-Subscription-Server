import { createHash, createPublicKey, randomBytes, sign, verify } from "node:crypto";

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomCode = () => randomBytes(18).toString("base64url");
const b64 = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function signEntitlement(payload: Record<string, unknown>) {
  const privateKey = process.env.ENTITLEMENT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("ENTITLEMENT_PRIVATE_KEY is required");
  const encoded = b64(JSON.stringify(payload));
  return `${encoded}.${sign(null, Buffer.from(encoded), privateKey).toString("base64url")}`;
}

export function verifyMachineSignature(input: { publicKey: string; body: string; timestamp: string; nonce: string; signature: string }) {
  const time = Number(input.timestamp);
  if (!Number.isFinite(time) || Math.abs(Date.now() - time) > 5 * 60_000) return false;
  const message = `${input.timestamp}.${input.nonce}.${sha256(input.body)}`;
  try {
    return verify(null, Buffer.from(message), createPublicKey(input.publicKey), Buffer.from(input.signature, "base64url"));
  } catch { return false; }
}
