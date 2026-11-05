import { describe, it, expect } from "vitest";
import { isMembershipActive, parseStudentQr } from "@/lib/membership";

const today = new Date("2026-11-05T10:00:00Z");

describe("membership", () => {
  it("not activated by admin → no discount", () => {
    expect(isMembershipActive({ membership_active: false, membership_expires: null }, false, today)).toBe(false);
  });
  it("activated with no end date → active", () => {
    expect(isMembershipActive({ membership_active: true, membership_expires: null }, false, today)).toBe(true);
  });
  it("expired yesterday → inactive", () => {
    expect(isMembershipActive({ membership_active: true, membership_expires: "2026-11-04" }, false, today)).toBe(false);
  });
  it("blocked student → inactive", () => {
    expect(isMembershipActive({ membership_active: true, membership_expires: null }, true, today)).toBe(false);
  });
});

describe("student QR", () => {
  it("reads card QR", () => {
    expect(parseStudentQr("guss:GUSS-2026-01234")).toEqual({ code: "GUSS-2026-01234", dealId: null });
  });
  it("reads deal QR", () => {
    expect(parseStudentQr("guss:GUSS-2026-01234:deal:123e4567-e89b-12d3-a456-426614174000")).toEqual({ code: "GUSS-2026-01234", dealId: "123e4567-e89b-12d3-a456-426614174000" });
  });
  it("rejects other codes", () => {
    expect(parseStudentQr("https://example.com")).toBeNull();
  });
});
