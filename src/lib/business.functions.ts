import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isMembershipActive } from "@/lib/membership";

export type ScannedStudent = {
  userId: string;
  name: string;
  university: string;
  faculty: string;
  city: string;
  memberCode: string;
  active: boolean;
  expires: string | null;
  avatarUrl: string | null;
  usesHere: number;
};

async function myApprovedBusiness(supabase: any, userId: string) {
  const { data } = await supabase.from("businesses").select("id, status").eq("owner_id", userId).maybeSingle();
  if (!data || data.status !== "approved") throw new Error("متجرك غير مفعّل بعد");
  return data.id as string;
}

async function findStudent(admin: any, code: string) {
  const { data: p } = await admin.from("profiles").select("*").ilike("member_code", code.trim()).maybeSingle();
  if (!p) throw new Error("لم يتم العثور على طالب بهذا الرمز");
  const { data: u } = await admin.auth.admin.getUserById(p.id);
  const banned = !!u?.user && !!(u.user as any).banned_until && new Date((u.user as any).banned_until) > new Date();
  return { p, active: isMembershipActive(p, banned) };
}

export const lookupStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => ({ code: String(d.code ?? "").slice(0, 40) }))
  .handler(async ({ data, context }): Promise<ScannedStudent> => {
    const businessId = await myApprovedBusiness(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { p, active } = await findStudent(supabaseAdmin, data.code);
    let avatarUrl: string | null = null;
    if (p.avatar_url) {
      const { data: s } = await supabaseAdmin.storage.from("avatars").createSignedUrl(p.avatar_url, 600);
      avatarUrl = s?.signedUrl ?? null;
    }
    const { count } = await supabaseAdmin.from("deal_redemptions").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("user_id", p.id);
    return {
      userId: p.id, name: p.full_name, university: p.university, faculty: p.faculty, city: p.city,
      memberCode: p.member_code, active, expires: p.membership_expires, avatarUrl, usesHere: count ?? 0,
    };
  });

export const confirmDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; dealId: string }) => d)
  .handler(async ({ data, context }) => {
    const businessId = await myApprovedBusiness(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: deal } = await supabaseAdmin.from("deals").select("id, business_id, active").eq("id", data.dealId).maybeSingle();
    if (!deal || deal.business_id !== businessId) throw new Error("هذا العرض لا يخص متجرك");
    if (!deal.active) throw new Error("هذا العرض متوقف");
    const { p, active } = await findStudent(supabaseAdmin, data.code);
    if (!active) throw new Error("عضوية الطالب غير فعّالة");
    const { error } = await supabaseAdmin.from("deal_redemptions").insert({ user_id: p.id, deal_id: deal.id, business_id: businessId });
    if (error) throw new Error("تعذّر تسجيل التخفيض");
    return { ok: true };
  });

export type RedemptionRow = { id: string; createdAt: string; student: string; memberCode: string; university: string; discount: string };

export const myRedemptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RedemptionRow[]> => {
    const businessId = await myApprovedBusiness(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("deal_redemptions").select("id, created_at, user_id, deal_id").eq("business_id", businessId).order("created_at", { ascending: false }).limit(500);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const dealIds = [...new Set((rows ?? []).map((r) => r.deal_id))];
    const { data: ps } = ids.length ? await supabaseAdmin.from("profiles").select("id, full_name, member_code, university").in("id", ids) : { data: [] as any[] };
    const { data: ds } = dealIds.length ? await supabaseAdmin.from("deals").select("id, discount").in("id", dealIds) : { data: [] as any[] };
    return (rows ?? []).map((r) => {
      const p = (ps ?? []).find((x: any) => x.id === r.user_id);
      const d = (ds ?? []).find((x: any) => x.id === r.deal_id);
      return { id: r.id, createdAt: r.created_at, student: p?.full_name ?? "—", memberCode: p?.member_code ?? "", university: p?.university ?? "", discount: d?.discount ?? "" };
    });
  });
