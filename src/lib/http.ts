import { NextResponse } from "next/server";
export const ok = (data: unknown, status = 200) => NextResponse.json({ statusCode: status, data, message: "OK", success: true }, { status });
export const fail = (message: string, status = 400, code?: string) => NextResponse.json({ statusCode: status, data: null, message, code, success: false }, { status });
