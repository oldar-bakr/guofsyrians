import { CityUniversitySelect } from "@/components/CityUniversitySelect";
import { CourseQuizManager } from "@/components/CourseQuiz";
import { ContentImages, ContentImageUpload } from "@/components/ContentImages";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, LogOut, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LessonVideosInput } from "@/components/ContributeForm";
import { sections, statusLabels, useContent, type ContentTable } from "@/lib/content";
import { ActivityManager } from "@/components/ActivityManager";
import { UsersManager } from "@/components/UsersManager";
import { BusinessesManager } from "@/components/BusinessesManager";
import { ComplaintsManager } from "@/components/ComplaintsManager";
import { AdminLayout, adminSectionKeys, type AdminSection } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { section?: AdminSection } => {
    const section = search["section"];
    return typeof section === "string" && adminSectionKeys.includes(section) ? { section: section as AdminSection } : {};
  },
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | تطبيق خدمات الطلاب" },
      { name: "description", content: "إدارة الأخبار والدورات والتخفيضات والفعاليات والمنتجات والفروع." },
      { property: "og:title", content: "لوحة الإدارة" },
      { property: "og:description", content: "إدارة محتوى تطبيق خدمات الطلاب." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { section } = Route.useSearch();
  const tab = section === "users" && state !== "admin" ? "news" : section ?? "news";

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

  return (
    <AdminLayout section={tab} role={state} email={email} onSignOut={signOut}>
        {tab === "complaints" ? <ComplaintsManager /> : tab === "users" ? <UsersManager myId={myId} /> : tab === "activity" ? <ActivityManager /> : tab === "businesses" ? <BusinessesManager /> : <SectionManager key={tab} table={tab} />}
    </AdminLayout>
  );
}

function SectionManager({ table }: { table: ContentTable }) {
  const qc = useQueryClient();
  const { fields, label } = sections[table];
  const { data = [], isLoading } = useContent(table);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [quizCourse, setQuizCourse] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  const hasReview = table === "courses" || table === "products";
  const pending = hasReview ? data.filter((r: any) => r["status"] === "pending") : [];
  const rows = hasReview ? data.filter((r: any) => r["status"] !== "pending") : data;

  const refresh = () => qc.invalidateQueries({ queryKey: ["content", table] });

  const save = async (row: Record<string, any>) => {
    setError("");
    const payload: Record<string, any> = {};
    fields.forEach((f) => (payload[f.key] = f.type === "number" ? Number(row[f.key] || 0) : f.type === "status" ? row[f.key] || "approved" : row[f.key] ?? ""));
    if (["news", "events", "products", "courses"].includes(table)) payload["images"] = row["images"] ?? [];
    if (table === "courses") {
      const n = Math.max(0, Math.min(100, Math.floor(payload["lessons"] || 0)));
      payload["lesson_videos"] = Array.from({ length: n }, (_, i) => (row["lesson_videos"] ?? [])[i]?.trim() ?? "");
    }
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{label} <span className="text-base text-muted-foreground">({data.length})</span></h2>
        <Button onClick={() => setEditing({})}><Plus className="h-4 w-4" />إضافة</Button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {(table === "courses" || table === "products") && pending.length > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-accent bg-accent/10 p-4">
          <h3 className="mb-3 font-display text-lg font-bold">بحاجة إلى موافقة <span className="text-sm text-muted-foreground">({pending.length})</span></h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((row: any) => (
              <div key={row["id"]} className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-soft">
                <ContentImages paths={row["images"]} title={row[fields[0]?.key ?? "title"] ?? ""} cover />
                <p className="font-bold">{row[fields[0]?.key ?? "title"]}</p>
                <p className="text-xs text-muted-foreground">
                  {table === "courses" ? `${row["category"] || "بدون تصنيف"} · ${row["lessons"] ?? 0} دروس · ${row["instructor"] || ""}` : `${row["price"] || ""} · ${row["seller"] || ""}`}
                </p>
                {row["description"] && <p className="line-clamp-3 text-sm">{row["description"]}</p>}
                <div className="mt-auto flex gap-2 pt-2">
                  <button onClick={() => save({ ...row, status: "approved" })} className="flex-1 rounded-xl bg-primary py-1.5 text-sm font-bold text-primary-foreground">موافقة</button>
                  <button onClick={() => save({ ...row, status: "rejected" })} className="flex-1 rounded-xl border border-destructive py-1.5 text-sm text-destructive">رفض</button>
                  <button aria-label="تعديل" onClick={() => setEditing(row)} className="rounded-xl border px-3 text-primary"><Pencil className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right text-xs text-muted-foreground">
            <tr>{fields.filter((f) => !f.hideInTable).map((f) => <th key={f.key} className="px-4 py-3 font-bold">{f.label}</th>)}<th className="w-24" /></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={fields.length + 1}>جارٍ التحميل...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td className="py-14 text-center text-muted-foreground" colSpan={fields.length + 1}>لا توجد سجلات في هذا القسم</td></tr>}
            {rows.map((row: any) => (
              <tr key={row["id"]} className="border-t transition-colors hover:bg-muted/40">
                {fields.filter((f) => !f.hideInTable).map((f) => <td key={f.key} className="px-4 py-3">{f.type === "status" ? <span className={`rounded-full px-2 py-0.5 text-xs ${row[f.key] === "pending" ? "bg-accent text-accent-foreground" : row[f.key] === "rejected" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"}`}>{statusLabels[row[f.key]] ?? row[f.key]}{row["submitted_by"] ? " · من طالب" : ""}</span> : row[f.key]}</td>)}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {table === "courses" && <Button size="sm" variant="outline" onClick={() => setQuizCourse(row)}>الاختبار</Button>}
                    <Button size="icon" variant="ghost" aria-label="تعديل" title="تعديل" onClick={() => setEditing(row)} className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="حذف" title="حذف" onClick={() => remove(row["id"])} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditDialog table={table} row={editing} onClose={() => setEditing(null)} onSave={save} />}
      {quizCourse && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"><div role="dialog" aria-modal="true" aria-label="إدارة اختبار الدورة" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">{quizCourse["title"]}</h3><Button variant="ghost" size="icon" aria-label="إغلاق" onClick={() => setQuizCourse(null)}><X /></Button></div><CourseQuizManager courseId={quizCourse["id"]} /></div></div>}
    </section>
  );
}

function EditDialog({ table, row, onClose, onSave }: { table: ContentTable; row: Record<string, any>; onClose: () => void; onSave: (r: Record<string, any>) => void }) {
  const [form, setForm] = useState(row);
  const [uploading, setUploading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form role="dialog" aria-modal="true" aria-label={`${row["id"] ? "تعديل" : "إضافة"} — ${sections[table].label}`} onSubmit={(e) => { e.preventDefault(); if (!uploading) onSave(form); }} className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{row["id"] ? "تعديل" : "إضافة"} — {sections[table].label}</h3>
          <Button type="button" variant="ghost" size="icon" disabled={uploading} onClick={onClose} aria-label="إغلاق"><X className="h-5 w-5" /></Button>
        </div>
        {table === "branches" && (
          <CityUniversitySelect universityOnly required city={form["city"] ?? ""} university={form["university"] ?? ""} faculty="" department="" onChange={(v) => setForm({ ...form, city: v.city, university: v.university })} labelClassName="mb-1 block" className="mt-1 w-full rounded-xl border bg-background px-3 py-2 disabled:opacity-60" />
        )}
        {sections[table].fields.filter((f) => table !== "branches" || !["city", "university"].includes(f.key)).map((f, i) => (
          <label key={f.key} className="block text-sm">
            {f.label}
            {f.type === "status" ? (
              <select value={form[f.key] || "approved"} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1 w-full rounded-xl border bg-background px-3 py-2">
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : f.type === "long" ? (
              <textarea rows={4} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" />
            ) : (
            <input
              required={i === 0 && table !== "branches"}
              type={f.type === "number" ? "number" : f.key === "application_url" ? "url" : f.key === "email" ? "email" : f.key === "contact" && table === "branches" ? "tel" : "text"}
              dir={f.key === "email" || (f.key === "contact" && table === "branches") ? "ltr" : undefined}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
            />
            )}
          </label>
        ))}
        {table === "courses" && (
          <LessonVideosInput count={Number(form["lessons"]) || 0} value={form["lesson_videos"] ?? []} onChange={(v) => setForm({ ...form, lesson_videos: v })} />
        )}
        {["news", "events", "products", "courses"].includes(table) && <ContentImageUpload value={form["images"] ?? []} onChange={(images) => setForm((current) => ({ ...current, images }))} onBusyChange={setUploading} />}
        <Button disabled={uploading} className="w-full">حفظ</Button>
      </form>
    </div>
  );
}
