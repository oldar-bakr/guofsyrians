import { describe, expect, it } from "vitest";
import { productContacts } from "@/lib/product-contact";

describe("published product contact", () => {
  it("extracts clickable phone and email from the published contact", () => {
    expect(productContacts("+90 507 530 88 10 / seller@example.org")).toEqual({ emails: ["seller@example.org"], phones: [{ label: "+90 507 530 88 10", href: "tel:+905075308810" }] });
  });
  it("does not invent missing contact details", () => {
    expect(productContacts("")).toEqual({ emails: [], phones: [] });
    expect(productContacts("seller20261234567@example.org").phones).toEqual([]);
  });
});