import { connectDb } from "@/lib/db";import{ok,fail}from"@/lib/http";
export async function GET(){try{await connectDb();return ok({ok:true,service:"pandas-subscription-service",time:new Date().toISOString()})}catch{return fail("Database unavailable",503)}}
