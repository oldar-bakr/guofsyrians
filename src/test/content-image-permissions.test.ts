import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../drizzle/migrations/0015_scholarships_and_content_images.sql", import.meta.url), "utf8");

describe("content image access policies", () => {
  it("limits image uploads to staff and their own folder", () => {
    const uploadPolicy = sql.match(/CREATE POLICY "content images staff upload"[^;]+/)?.[0];
    expect(uploadPolicy).toContain("TO authenticated");
    expect(uploadPolicy).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(uploadPolicy).toContain("public.can_edit_content(auth.uid())");
  });
  it("binds product photo visibility to a published product or its submitter", () => {
    const readPolicy = sql.match(/CREATE POLICY "content images visible read"[\s\S]+/)?.[0];
    expect(readPolicy).toContain("storage.objects.name = ANY(p.images)");
    expect(readPolicy).toContain("p.status = 'approved' OR p.submitted_by = auth.uid()");
  });
});