import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { connectDb } from "../src/lib/db";
import { AdminUser } from "../src/lib/models";
import { encryptSecret } from "../src/lib/secret-box";
import mongoose from "mongoose";

async function main() {
  const [email, password, name = "PANDAS Administrator"] = process.argv.slice(2);
  if (!email || !password || password.length < 12) {
    throw new Error("Usage: npm run bootstrap-admin -- email password-at-least-12-chars [name]");
  }

  await connectDb();
  const totpSecret = authenticator.generateSecret();
  await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      name,
      role: "owner",
      totpSecret: encryptSecret(totpSecret),
      active: true,
      failedLoginCount: 0,
      lockedUntil: null
    },
    { upsert: true, new: true }
  );
  console.log(`Admin created. Add this TOTP secret to your authenticator app: ${totpSecret}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
