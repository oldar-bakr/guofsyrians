import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ManagedRole = "admin" | "editor" | "user";
export type ManagedUser = {
  id: string;
  email: string;
  provider: string;
  createdAt: string;
  lastSignIn: string | null;
  role: ManagedRole;
  banned: boolean;
  isOwner: boolean;
  fullName: string;
  phone: string;
  university: string;
  city: string;
};

// The app owner's account can never be demoted, blocked or deleted.
const OWNER_EMAIL = "oldar.bakr@gmail.com";
async function assertNotOwner(admin: any, userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  if (data?.user?.email?.toLowerCase() === OWNER_EMAIL) throw new Error("لا يمكن تعديل حساب مالك التطبيق");
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error("تعذّر تحميل المستخدمين");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, phone, university, city");
    const rank = { admin: 3, editor: 2, user: 1 } as const;
    return data.users.map((u) => {
      const mine = (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as ManagedRole);
      const p = (profiles ?? []).find((x) => x.id === u.id);
      const role = mine.sort((a, b) => rank[b] - rank[a])[0] ?? "user";
      return {
        id: u.id,
        email: u.email ?? "",
        provider: (u.app_metadata?.["provider"] as string) ?? "email",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        role,
        banned: !!(u as any).banned_until && new Date((u as any).banned_until) > new Date(),
        isOwner: (u.email ?? "").toLowerCase() === OWNER_EMAIL,
        fullName: p?.full_name ?? "",
        phone: p?.phone ?? "",
        university: p?.university ?? "",
        city: p?.city ?? "",
      };
    });
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: ManagedRole }) => {
    if (!["admin", "editor", "user"].includes(d.role)) throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && data.role !== "admin") throw new Error("لا يمكنك إزالة صلاحية الإدارة عن نفسك");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertNotOwner(supabaseAdmin, data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error("تعذّر تغيير الصلاحية");
    return { ok: true };
  });

export const setUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; blocked: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك إيقاف حسابك");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertNotOwner(supabaseAdmin, data.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.blocked ? "876000h" : "none" });
    if (error) throw new Error("تعذّر تحديث الحساب");
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertNotOwner(supabaseAdmin, data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("تعذّر حذف المستخدم");
    return { ok: true };
  });
