import { describe, it, expect } from "vitest";
import { isPublished, splitReviewRows } from "../lib/content-visibility";
describe("staff content visibility", () => {
  it("disabled items disappear without deleting them", () => {
    expect(isPublished({ active: false, status: "approved" })).toBe(false);
    expect(isPublished({ active: true, status: "approved" })).toBe(true);
  });
  it("staff-disabled offers stay hidden even when their owner enables them", () => {
    expect(isPublished({ active: true, staff_active: false, status: "approved" })).toBe(false);
  });
  it("pending and rejected submissions cannot appear as published", () => {
    expect(isPublished({ active: true, status: "pending" })).toBe(false);
    expect(isPublished({ active: true, status: "rejected" })).toBe(false);
  });
  it("separates pending approvals from the lower records list", () => {
    const rows = [{ id: "pending-course", status: "pending" }, { id: "published-course", status: "approved" }];
    expect(splitReviewRows(rows).pending.map(row => row.id)).toEqual(["pending-course"]);
    expect(splitReviewRows(rows).published.map(row => row.id)).toEqual(["published-course"]);
  });
});