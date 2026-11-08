/** Simulation only: never use this module for membership or service authorization. */
export const DEMO_PLAN = { amount: 100, currency: "TRY", interval: "month" } as const;

export type DemoOutcome = "success" | "failure";
export function simulateSubscription(outcome: DemoOutcome) {
  return { outcome, plan: DEMO_PLAN, grantsMembership: false as const, chargedAmount: 0 as const };
}