# PANDAS Subscription Service

Next.js control plane for PANDAS ERP licensing and EasyPaisa payments.

1. Copy `.env.example` to `.env.local` and configure a MongoDB Atlas database.
2. Generate the entitlement signing keys with Node.js and put the PEM values in the matching environment variables:

   `node -e "const c=require('node:crypto');const k=c.generateKeyPairSync('ed25519',{privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});console.log(k.privateKey);console.log(k.publicKey)"`

   Copy only the public key to each local ERP as `SUBSCRIPTION_SIGNING_PUBLIC_KEY`.
3. Run `npm install` and `npm run bootstrap-admin -- admin@example.com password-at-least-12-characters`. The command loads `.env.local` and prints the TOTP secret once; add it to your authenticator app immediately.
4. Sign in at `/admin`, configure the three plans, create a business, and issue its activation code.

MongoDB must be an Atlas/replica-set deployment because payment completion and manual renewal use transactions. `EASYPAISA_PROVIDER=mock` is intentionally non-production. Implement the approved merchant request, callback signature, and inquiry contract in `src/lib/payment-provider.ts` before accepting real funds.

Configure the hosting provider to call `GET` or `POST /api/v1/cron/reconcile` with `Authorization: Bearer $CRON_SECRET` every 15 minutes. The health probe is `GET /api/v1/health`.
