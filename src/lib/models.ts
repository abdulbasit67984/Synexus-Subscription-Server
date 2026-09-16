import mongoose, { Schema } from "mongoose";
import { BILLING_TYPES, PAYMENT_STATUSES, SUBSCRIPTION_STATUSES } from "./contracts";

const model = <T>(name: string, schema: Schema<T>) =>
  (mongoose.models[name] as mongoose.Model<T> | undefined) || mongoose.model<T>(name, schema);

const planSchema = new Schema({
  key: { type: String, enum: ["basic", "premium", "enterprise"], unique: true, required: true },
  name: { type: String, required: true }, monthlyPrice: { type: Number, min: 0, required: true },
  annualPrice: { type: Number, min: 0, required: true }, features: { type: [String], default: [] },
  addOns: { type: [String], default: [] }, userLimit: { type: Number, min: 1, default: 1 }, active: { type: Boolean, default: true }
}, { timestamps: true });

const businessSchema = new Schema({
  name: { type: String, required: true, trim: true }, externalReference: { type: String, trim: true },
  planKey: { type: String, enum: ["basic", "premium", "enterprise"], required: true },
  billingType: { type: String, enum: BILLING_TYPES, required: true },
  configuredStatus: { type: String, enum: SUBSCRIPTION_STATUSES, default: "active" },
  paidThrough: { type: Date, default: null }, negotiatedPrice: { type: Number, min: 0, default: null },
  productEdition: { type: String, default: "current" }, grantedFeatures: { type: [String], default: [] },
  grantedAddOns: { type: [String], default: [] }, userLimit: { type: Number, min: 1, default: 1 },
  agreementNotes: { type: String, default: "" }, activeInstallationId: { type: Schema.Types.ObjectId, ref: "Installation", default: null }
}, { timestamps: true });

const installationSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  publicKey: { type: String, required: true }, label: { type: String, default: "ERP" },
  fingerprint: { type: String, default: "" }, status: { type: String, enum: ["active", "revoked"], default: "active" },
  activatedAt: { type: Date, default: Date.now }, lastSeenAt: { type: Date, default: null }, recentNonces: { type: [String], default: [] }
}, { timestamps: true });
installationSchema.index({ businessId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } });

const activationCodeSchema = new Schema({
  codeHash: { type: String, required: true, unique: true }, businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
  expiresAt: { type: Date, required: true }, usedAt: { type: Date, default: null }, usedByInstallationId: { type: Schema.Types.ObjectId, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true }
}, { timestamps: true });

const entitlementSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  installationId: { type: Schema.Types.ObjectId, ref: "Installation", required: true, index: true },
  token: { type: String, required: true }, status: { type: String, enum: SUBSCRIPTION_STATUSES, required: true },
  issuedAt: { type: Date, required: true }, offlineValidUntil: { type: Date, default: null }
}, { timestamps: true });

const paymentOrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true }, businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  billingType: { type: String, enum: BILLING_TYPES, required: true }, terms: { type: Number, min: 1, max: 12, default: 1 },
  amount: { type: Number, min: 0, required: true }, currency: { type: String, default: "PKR" },
  status: { type: String, enum: PAYMENT_STATUSES, default: "pending" }, provider: { type: String, default: "easypaisa" },
  providerTransactionId: { type: String, sparse: true, unique: true }, expiresAt: { type: Date, required: true }, completedAt: { type: Date, default: null }
}, { timestamps: true });

const eventSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  type: { type: String, required: true }, actorType: { type: String, enum: ["admin", "payment", "system"], required: true },
  actorId: { type: String, default: "" }, reason: { type: String, default: "" }, before: Schema.Types.Mixed, after: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed
}, { timestamps: true });

const paymentEventSchema = new Schema({
  orderId: { type: String, required: true, index: true }, providerEventId: { type: String, required: true, unique: true },
  status: { type: String, required: true }, payload: Schema.Types.Mixed
}, { timestamps: true });

const adminUserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true },
  name: { type: String, required: true }, role: { type: String, enum: ["owner", "operator", "viewer"], default: "operator" },
  totpSecret: { type: String, required: true }, active: { type: Boolean, default: true }, lastLoginAt: Date,
  failedLoginCount: { type: Number, default: 0 }, lockedUntil: { type: Date, default: null }
}, { timestamps: true });

export const Plan = model("Plan", planSchema);
export const Business = model("Business", businessSchema);
export const Installation = model("Installation", installationSchema);
export const ActivationCode = model("ActivationCode", activationCodeSchema);
export const Entitlement = model("Entitlement", entitlementSchema);
export const PaymentOrder = model("PaymentOrder", paymentOrderSchema);
export const PaymentEvent = model("PaymentEvent", paymentEventSchema);
export const SubscriptionEvent = model("SubscriptionEvent", eventSchema);
export const AuditLog = model("AuditLog", eventSchema);
export const AdminUser = model("AdminUser", adminUserSchema);
