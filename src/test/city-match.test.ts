import { describe, it, expect } from "vitest";
import { sameCity } from "@/lib/city-match";
describe("sameCity", () => {
  it("matches Arabic deal city to Turkish profile city", () => {
    expect(sameCity("إسطنبول", "İstanbul")).toBe(true);
    expect(sameCity("غازي عنتاب", "Gaziantep")).toBe(true);
  });
  it("does not match different cities", () => expect(sameCity("أنقرة", "İstanbul")).toBe(false));
});
