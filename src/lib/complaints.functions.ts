import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { complaintSchema, validateComplaintSize, complaintIdentity } from "./complaints";

export const submitComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => complaintSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let path: string | null = null;
    let size: number | null = null;
    if (data.attachment) {
      const bytes = Uint8Array.from(atob(data.attachment.base64), c => c.charCodeAt(0));
      validateComplaintSize(bytes.length);
      size = bytes.length;
      // Random paths, no owner identifier or original filename; download-only binary storage.
      path = `${crypto.randomUUID()}/attachment`;
      const { error } = await supabaseAdmin.storage.from("complaint-media").upload(path, bytes, { contentType: "application/octet-stream", upsert: false });
      if (error) throw new Error("تعذّر رفع المرفق");
    }
    const { data: row, error } = await supabaseAdmin.from("student_complaints").insert({
      title: data.title, body: data.body, anonymous: data.anonymous,
      user_id: complaintIdentity(data.anonymous, context.userId),
      attachment_path: path, attachment_name: data.attachment?.name ?? null, attachment_size: size,
    }).select("id").single();
    if (error) {
      if (path) await supabaseAdmin.storage.from("complaint-media").remove([path]);
      throw new Error("تعذّر إرسال الشكوى، حاول مجددًا");
    }
    return { id: row.id };
  });

export const listComplaints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed } = await context.supabase.rpc("can_edit_content", { _user_id: context.userId });
    if (!allowed) throw new Error("غير مسموح");
    const { data, error } = await context.supabase.from("student_complaints").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("تعذّر تحميل الشكاوى");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return Promise.all(data.map(async row => {
      const { data: profile } = row.user_id ? await context.supabase.from("profiles").select("full_name").eq("id", row.user_id).maybeSingle() : { data: null };
      const signed = row.attachment_path ? await supabaseAdmin.storage.from("complaint-media").createSignedUrl(row.attachment_path, 300, { download: row.attachment_name ?? "attachment" }) : null;
      return { ...row, student_name: row.anonymous ? null : profile?.full_name ?? "طالب", attachment_url: signed?.data?.signedUrl ?? null };
    }));
  });

export const reviewComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "closed"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("can_edit_content", { _user_id: context.userId });
    if (!allowed) throw new Error("غير مسموح");
    const { data: row, error } = await context.supabase.from("student_complaints").update({ status: data.status }).eq("id", data.id).select("id").single();
    if (error || !row) throw new Error("تعذّر تحديث الحالة");
    return { ok: true };
  });