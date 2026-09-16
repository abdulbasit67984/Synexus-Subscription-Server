import { connectDb } from "@/lib/db";import{PaymentOrder}from"@/lib/models";import{fail,ok}from"@/lib/http";
async function reconcile(request:Request){if(request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return fail("Unauthorized",401);await connectDb();const result=await PaymentOrder.updateMany({status:"pending",expiresAt:{$lt:new Date()}},{$set:{status:"expired"}});return ok({expiredOrders:result.modifiedCount})}
export const GET=reconcile;
export const POST=reconcile;
