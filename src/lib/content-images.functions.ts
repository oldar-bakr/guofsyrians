import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVisibleContentImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ paths: z.array(z.string().max(300).regex(/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/i)).max(100) }))
  .handler(async ({ data, context }) => {
    if (!data.paths.length) return [];
    const { data: staff, error: roleError } = await context.supabase.rpc("can_edit_content", { _user_id: context.userId });
    if (roleError) throw new Error("تعذّر التحقق من صلاحية الصور");
    const allowed = new Set<string>();
    if (staff) data.paths.forEach((path) => allowed.add(path));
    else {
      // All queries use the caller's RLS, including owner visibility for pending rows.
      for (const table of ["news", "events", "products", "courses"] as const) {
        const cols = table === "products" || table === "courses" ? "images, active, status" : "images, active";
        const { data: rows, error } = await context.supabase.from(table).select(cols).overlaps("images", data.paths);
        if (error) throw new Error("تعذّر التحقق من الصور");
        for (const row of (rows ?? []) as any[]) {
          // Published rows may show any of their images; unpublished rows only the caller's own uploads,
          // so referencing someone else's file in your own record never yields a link to it.
          const published = row.active && (row.status === undefined || row.status === "approved");
          for (const path of row.images as string[]) {
            if (!data.paths.includes(path)) continue;
            if (published || path.startsWith(`${context.userId}/`)) allowed.add(path);
          }
        }
      }
    }
    const paths = data.paths.filter((path) => allowed.has(path));
    if (!paths.length) return data.paths.map(() => "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from("content-images").createSignedUrls(paths, 3600);
    if (error) throw new Error("تعذّر تحميل الصور");
    return data.paths.map((path) => signed?.find((item) => item.path === path)?.signedUrl ?? "");
  });