import { describe, expect, it } from "vitest";
import { phoneHref, remarkPhoneLinks, safeAssistantUrl } from "@/lib/assistant-links";
import type { Root } from "mdast";
describe("Assistant contact links", () => {
  it("turns the union phone into a callable international number", () => {
    expect(phoneHref("+90 507 530 88 10")).toBe("tel:+905075308810");
    expect(phoneHref("+٩٠ ٥٠٧ ٥٣٠ ٨٨ ١٠")).toBe("tel:+905075308810");
    expect(phoneHref("100")).toBeNull();
  });
  it("links phone text without changing existing links", () => {
    const tree: Root = { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value: "اتصل: +90 507 530 88 10" }, { type: "link", url: "tel:+905075308810", children: [{ type: "text", value: "+90 507 530 88 10" }] }] }] };
    remarkPhoneLinks()(tree);
    expect(tree.children[0]).toEqual({ type: "paragraph", children: [{ type: "text", value: "اتصل: " }, { type: "link", url: "tel:+905075308810", children: [{ type: "text", value: "+90 507 530 88 10" }] }, { type: "link", url: "tel:+905075308810", children: [{ type: "text", value: "+90 507 530 88 10" }] }] });
  });
  it("allows contact and page links but rejects unsafe schemes", () => {
    expect(safeAssistantUrl("mailto:guofsysrians@gmail.com")).toBe("mailto:guofsysrians@gmail.com");
    expect(safeAssistantUrl("/courses")).toBe("/courses");
    expect(safeAssistantUrl("https://x.com/guofsyrians")).toBe("https://x.com/guofsyrians");
    expect(safeAssistantUrl("javascript:alert(1)")).toBe("");
    expect(safeAssistantUrl("//example.com")).toBe("");
  });
});