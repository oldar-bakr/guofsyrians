import { describe, expect, it } from "vitest";
import { dealCompanyKey, filterDeals } from "@/lib/deal-filters";
const offers = [
  { id: "1", business_id: "a", partner: "مقهى", city: "إسطنبول", category: "طعام", discount: "10%", terms: "قهوة للطلاب" },
  { id: "2", business_id: "b", partner: "مقهى", city: "İstanbul", category: "طعام", discount: "20%", terms: "وجبات" },
  { id: "3", business_id: null, partner: "مكتبة الأمل", city: "أنقرة", category: "كتب", discount: "15%", terms: "كتب عربية" },
] as const;
const shops = [{ id: "a", name: "Student Cafe" }, { id: "b", name: "Other Cafe" }];
describe("Deal filters", () => {
  it("filters all offers in a city, including Arabic and Turkish spellings", () => {
    expect(filterDeals(offers, shops, { city: "İstanbul", company: "", query: "" }).map((d) => d.id)).toEqual(["1", "2"]);
  });
  it("filters by company identity even when different companies share an offer label", () => {
    expect(filterDeals(offers, shops, { city: "", company: dealCompanyKey(offers[0]), query: "" }).map((d) => d.id)).toEqual(["1"]);
    expect(filterDeals(offers, shops, { city: "", company: dealCompanyKey(offers[2]), query: "" }).map((d) => d.id)).toEqual(["3"]);
  });
  it("searches official company names and Arabic offer details while combining filters", () => {
    expect(filterDeals(offers, shops, { city: "إسطنبول", company: "business:a", query: " STUDENT cafe " }).map((d) => d.id)).toEqual(["1"]);
    expect(filterDeals(offers, shops, { city: "", company: "", query: "الامل كتب" }).map((d) => d.id)).toEqual(["3"]);
    expect(filterDeals(offers, shops, { city: "أنقرة", company: "business:a", query: "" })).toEqual([]);
  });
});