import assert from "node:assert/strict"; import test from "node:test"; import { calculatePaidThrough, deriveStatus } from "./contracts";
test("monthly renewal clamps to the end of the target month",()=>{assert.equal(calculatePaidThrough(new Date("2026-10-31T00:00:00Z"),new Date("2026-09-15T00:00:00Z"),"monthly").toISOString(),"2026-11-30T00:00:00.000Z")});
test("annual renewal handles leap years",()=>{assert.equal(calculatePaidThrough(null,new Date("2024-02-29T00:00:00Z"),"annual").toISOString(),"2025-02-28T00:00:00.000Z")});
test("perpetual is active without paid-through",()=>{assert.equal(deriveStatus({billingType:"perpetual"}),"active")});
test("expired recurring contract is expired",()=>{assert.equal(deriveStatus({billingType:"monthly",paidThrough:new Date("2020-01-01")}),"expired")});
