import { describe, it, expect } from "vitest";
import { validateComplaintSize, complaintIdentity, complaintSchema } from "../lib/complaints";

describe("student complaints", () => {
  it("accepts exactly 3 MB and rejects larger attachments", () => {
    expect(() => validateComplaintSize(3145728)).not.toThrow();
    expect(() => validateComplaintSize(3145729)).toThrow();
  });
  it("never stores the account identifier for anonymous submissions", () => {
    expect(complaintIdentity(true, "student-id")).toBeNull();
    expect(complaintIdentity(false, "student-id")).toBe("student-id");
  });
  it("requires a title and message", () => {
    expect(complaintSchema.safeParse({ title: " ", body: "تفاصيل", anonymous: true }).success).toBe(false);
    expect(complaintSchema.safeParse({ title: "ملاحظة", body: " ", anonymous: false }).success).toBe(false);
  });
});