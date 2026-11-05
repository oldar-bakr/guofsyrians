import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, LogOut, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sections, useContent, type ContentTable } from "@/lib/content";
import { ActivityManager } from "@/components/ActivityManager";
import { UsersManager } from "@/components/UsersManager";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | تطبيق خدمات الطلاب" },
      { name: "description", content: "إدارة الأخبار والدورات والتخفيضات والفعاليات والمنتجات والفروع." },
      { property: "og:title", content: "لوحة الإدارة" },
      { property: "og:description", content: "إدارة محتوى تطبيق خدمات الطلاب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<"loading" | "admin" | "editor" | "denied">("loading");
  const [email, setEmail] = useState("");
  const [myId, setMyId] = useState("");
  const [tab, setTab] = useState<ContentTable | "users" | "activity">("news");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate({ to: "/auth", replace: true });
      setEmail(data.user.email ?? "");
      setMyId(data.user.id);
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (isAdmin) return setState("admin");
      const { data: isEditor } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "editor" });
      setState(isEditor ? "editor" : "denied");
    })();
  }, [navigate]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (state === "loading") return <div className="grid min-h-screen place-items-center">جارٍ التحميل...</div>;
  if (state === "denied")
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="font-display text-xl font-bold">ليست لديك صلاحية الدخول إلى لوحة الإدارة</p>
          <p className="mt-2 text-sm text-muted-foreground">{email}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/home" className="rounded-xl border px-4 py-2">العودة للتطبيق</Link>
            <button onClick={signOut} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground">تسجيل الخروج</button>
          </div>
        </div>
      </div>
    );

  const tabs: { key: ContentTable | "users" | "activity"; label: string }[] = [
    { key: "activity", label: "نشاط الطلاب" },
    ...(Object.keys(sections) as ContentTable[]).map((t) => ({ key: t, label: sections[t].label })),
    ...(state === "admin" ? [{ key: "users" as const, label: "المستخدمون والصلاحيات" }] : []),
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="" className="h-10 w-10 rounded-full bg-card object-contain p-1" />
            <div>
              <h1 className="font-display text-xl font-bold">لوحة الإدارة</h1>
              <p className="text-xs opacity-80">{email} · {state === "admin" ? "مدير" : "محرر"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/home" className="underline">عرض التطبيق</Link>
            <button onClick={signOut} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground"><LogOut className="h-4 w-4" />خروج</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-t-xl px-4 py-2 text-sm ${t.key === tab ? "bg-muted font-bold text-foreground" : "opacity-80"}`}>{t.label}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-5">
        {tab === "users" ? <UsersManager myId={myId} /> : tab === "activity" ? <ActivityManager /> : <SectionManager key={tab} table={tab} />}
      </main>
    </div>
  );
}

function SectionManager({ table }: { table: ContentTable }) {
  const qc = useQueryClient();
  const { fields, label } = sections[table];
  const { data = [], isLoading } = useContent(table);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["content", table] });

  const save = async (row: Record<string, any>) => {
    setError("");
    const payload: Record<string, any> = {};
    fields.forEach((f) => (payload[f.key] = f.type === "number" ? Number(row[f.key] || 0) : row[f.key] ?? ""));
    const { error } = row["id"]
      ? await supabase.from(table).update(payload as never).eq("id", row["id"])
      : await supabase.from(table).insert(payload as never);
    if (error) return setError("تعذّر الحفظ: " + error.message);
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("هل تريد الحذف؟")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setError("تعذّر الحذف: " + error.message);
    refresh();
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{label} <span className="text-base text-muted-foreground">({data.length})</span></h2>
        <button onClick={() => setEditing({})} className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />إضافة</button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-right">
            <tr>{fields.filter((f) => !f.hideInTable).map((f) => <th key={f.key} className="px-4 py-3 font-bold">{f.label}</th>)}<th className="w-24" /></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={fields.length + 1}>جارٍ التحميل...</td></tr>}
            {data.map((row: any) => (
              <tr key={row["id"]} className="border-t">
                {fields.filter((f) => !f.hideInTable).map((f) => <td key={f.key} className="px-4 py-3">{row[f.key]}</td>)}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button aria-label="تعديل" onClick={() => setEditing(row)} className="text-primary"><Pencil className="h-4 w-4" /></button>
                    <button aria-label="حذف" onClick={() => remove(row["id"])} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditDialog table={table} row={editing} onClose={() => setEditing(null)} onSave={save} />}
    </section>
  );
}

function EditDialog({ table, row, onClose, onSave }: { table: ContentTable; row: Record<string, any>; onClose: () => void; onSave: (r: Record<string, any>) => void }) {
  const [form, setForm] = useState(row);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{row["id"] ? "تعديل" : "إضافة"} — {sections[table].label}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {sections[table].fields.map((f, i) => (
          <label key={f.key} className="block text-sm">
            {f.label}
            {f.type === "long" ? (
              <textarea rows={4} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" />
            ) : (
            <input
              required={i === 0}
              type={f.type === "number" ? "number" : "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
            />
            )}
          </label>
        ))}
        <button className="w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">حفظ</button>
      </form>
    </div>
  );
}
