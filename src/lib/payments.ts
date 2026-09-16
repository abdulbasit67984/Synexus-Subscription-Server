import { calculatePaidThrough } from "./contracts";
import { Business, PaymentEvent, PaymentOrder, SubscriptionEvent } from "./models";
import type { PaymentNotification } from "./payment-provider";
import { withMongoTransaction } from "./transaction";

const providerSuccess = new Set(["successful", "SUCCESS", "PAID"]);
export async function applyPaymentNotification(notification: PaymentNotification) {
  return withMongoTransaction(async (session) => {
      const duplicate = await PaymentEvent.findOne({ providerEventId: notification.eventId }).session(session);
      if (duplicate) return { duplicate: true, orderId: notification.orderId };
      const order = await PaymentOrder.findOne({ orderId: notification.orderId }).session(session);
      if (!order) throw new Error("Payment order not found");
      if (Number(order.amount) !== notification.amount) throw new Error("Payment amount does not match order");
      await PaymentEvent.create([{ orderId: order.orderId, providerEventId: notification.eventId, status: notification.status, payload: notification.raw }], { session: session || undefined });
      if (!providerSuccess.has(notification.status)) {
        order.status = (["failed", "cancelled", "expired", "reversed"] as string[]).includes(notification.status) ? notification.status as never : "payment_review";
        await order.save({ session }); return { duplicate: false, orderId: order.orderId, status: order.status };
      }
      if (order.status === "successful") return { duplicate: true, orderId: order.orderId };
      const business = await Business.findById(order.businessId).session(session);
      if (!business) throw new Error("Business not found");
      const before = business.paidThrough;
      const completedAt = new Date();
      business.paidThrough = calculatePaidThrough(before, completedAt, business.billingType as never, order.terms);
      business.configuredStatus = "active";
      order.status = "successful"; order.providerTransactionId = notification.transactionId; order.completedAt = completedAt;
      await business.save({ session }); await order.save({ session });
      await SubscriptionEvent.create([{ businessId: business._id, type: "payment_renewal", actorType: "payment", actorId: notification.transactionId, before: { paidThrough: before }, after: { paidThrough: business.paidThrough }, metadata: { orderId: order.orderId, amount: order.amount, terms: order.terms } }], { session: session || undefined });
      return { duplicate: false, orderId: order.orderId, status: order.status, paidThrough: business.paidThrough };
  });
}
