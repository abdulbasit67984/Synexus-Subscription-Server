import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentNotification = { eventId: string; orderId: string; transactionId: string; status: string; amount: number; raw: unknown };
export interface PaymentProvider {
  createCheckout(input: { orderId: string; amount: number; returnUrl: string }): Promise<{ redirectUrl: string }>;
  parseNotification(body: string, signature: string | null): Promise<PaymentNotification>;
}

class MockEasyPaisaProvider implements PaymentProvider {
  async createCheckout(input: { orderId: string; amount: number; returnUrl: string }) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return { redirectUrl: `${appUrl}/checkout/${encodeURIComponent(input.orderId)}?mock=1` };
  }
  async parseNotification(body: string, supplied: string | null) {
    const secret = process.env.EASYPAISA_CALLBACK_SECRET || "";
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    if (!supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) throw new Error("Invalid callback signature");
    const raw = JSON.parse(body);
    return { eventId: String(raw.eventId), orderId: String(raw.orderId), transactionId: String(raw.transactionId), status: String(raw.status), amount: Number(raw.amount), raw };
  }
}

class UnconfiguredEasyPaisaProvider implements PaymentProvider {
  async createCheckout(): Promise<{ redirectUrl: string }> { throw new Error("EasyPaisa merchant integration is not configured"); }
  async parseNotification(): Promise<PaymentNotification> { throw new Error("EasyPaisa merchant integration is not configured"); }
}

export const paymentProvider: PaymentProvider = process.env.EASYPAISA_PROVIDER === "mock" ? new MockEasyPaisaProvider() : new UnconfiguredEasyPaisaProvider();
