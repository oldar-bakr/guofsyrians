import { describe, expect, it } from "vitest";
import { DEMO_PLAN, simulateSubscription } from "@/lib/subscription-demo";

describe("Demo subscription", () => {
  it("offers 100 Turkish lira monthly", () => {
    expect(DEMO_PLAN).toEqual({ amount: 100, currency: "TRY", interval: "month" });
  });
  it("never charges real money or grants real membership on success", () => {
    expect(simulateSubscription("success")).toMatchObject({ outcome: "success", grantsMembership: false, chargedAmount: 0 });
  });
  it("keeps failed simulations separate from successful ones", () => {
    expect(simulateSubscription("failure")).toMatchObject({ outcome: "failure", grantsMembership: false, chargedAmount: 0 });
  });
});