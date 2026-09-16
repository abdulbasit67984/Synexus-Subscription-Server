import { NextRequest } from "next/server";
import { Installation } from "./models";
import { verifyMachineSignature } from "./crypto";

export async function authenticateMachine(request: NextRequest, body: string) {
  const installationId = request.headers.get("x-installation-id") || "";
  const installation = await Installation.findById(installationId);
  if (!installation || installation.status !== "active") return null;
  const valid = verifyMachineSignature({
    publicKey: installation.publicKey, body,
    timestamp: request.headers.get("x-timestamp") || "",
    nonce: request.headers.get("x-nonce") || "",
    signature: request.headers.get("x-signature") || ""
  });
  if (!valid) return null;
  const nonce = request.headers.get("x-nonce") || "";
  const accepted = await Installation.updateOne(
    { _id: installation._id, recentNonces: { $ne: nonce } },
    { $push: { recentNonces: { $each: [nonce], $slice: -100 } } }
  );
  return accepted.modifiedCount === 1 ? installation : null;
}
