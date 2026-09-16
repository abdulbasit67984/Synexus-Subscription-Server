import mongoose from "mongoose";

const globalMongo = globalThis as typeof globalThis & { __pandasMongo?: Promise<typeof mongoose> };

export async function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  globalMongo.__pandasMongo ||= mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000
  });
  return globalMongo.__pandasMongo;
}
