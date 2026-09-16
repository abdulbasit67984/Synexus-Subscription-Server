import { connectDb } from "@/lib/db";
import { PaymentOrder } from "@/lib/models";
import { fail, ok } from "@/lib/http";
export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  await connectDb(); const { orderId } = await context.params; const order = await PaymentOrder.findOne({ orderId }).select("orderId status amount currency expiresAt completedAt").lean();
  return order ? ok(order) : fail("Payment order not found", 404);
}
