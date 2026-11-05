import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels } from "@/lib/content";
import { useMyProfile } from "@/lib/profile";

export type ContributeKind = "courses" | "products";

type Field = { key: string; label: string; long?: boolean; number?: boolean; required?: boolean };

const defs: Record<ContributeKind, { label: string; fields: Field[] }> = {
  courses: {
    label: "دورة",
    fields: [
      { key: "title", label: "اسم الدورة", required: true },
      { key: "category", label: "التصنيف" },
      { key: "instructor", label: "اسم المدرّب" },
      { key: "lessons", label: "عدد الدروس", number: true },
      { key: "video_url", label: "رابط فيديو تعريفي (اختياري)" },
      { key: "contact", label: "رقم أو بريد للتواصل" },
      { key: "description", label: "وصف الدورة", long: true },
    ],
  },
  products: {
    label: "منتج",
    fields: [
      { key: "name", label: "اسم المنتج", required: true },
      { key: "price", label: "السعر" },
      { key: "seller", label: "اسم البائع" },
      { key: "contact", label: "رقم أو بريد للتواصل" },
      { key: "description", label: "وصف المنتج", long: true },
    ],
  },
};

function useMySubmissions(kind: ContributeKind) {
  return useQuery({
    queryKey: ["my-submissions", kind],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(kind)
        .select("*")
        .eq("submitted_by", u.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function ContributeForm({ kind }: { kind: ContributeKind }) {
  const qc = useQueryClient();
  const { data: mine = [] } = useMySubmissions(kind);
  const [form, setForm] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");
  const def = defs[kind];
  const titleKey = def.fields[0]!.key;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const { data: u } = await supabase.auth.getUser();
    const payload: Record<string, any> = {};
    def.fields.forEach((f) => (payload[f.key] = f.number ? Number(form[f.key] || 0) : form[f.key] ?? ""));
    const { error } = form["id"]
      ? await supabase.from(kind).update(payload as never).eq("id", form["id"])
      : await supabase.from(kind).insert({ ...payload, submitted_by: u.user!.id } as never);
    if (error) return setMsg("تعذّر الإرسال: " + error.message);
    setForm({});
    setMsg("تم الإرسال، وسيظهر للطلاب بعد موافقة الإدارة.");
    qc.invalidateQueries({ queryKey: ["my-submissions", kind] });
    qc.invalidateQueries({ queryKey: ["content", kind] });
  };

  const remove = async (id: string) => {
    if (!confirm("هل تريد الحذف؟")) return;
    await supabase.from(kind).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-submissions", kind] });
    qc.invalidateQueries({ queryKey: ["content", kind] });
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="font-display text-lg font-bold">
            {form["id"] ? "تعديل" : "إضافة"} {def.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            تراجع الإدارة كل {def.label} قبل نشره. أي تعديل يعيده للمراجعة.
          </p>
          {def.fields.map((f) => (
            <label key={f.key} className="block text-sm">
              {f.label}
              {f.long ? (
                <textarea
                  rows={4}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
                />
              ) : (
                <input
                  required={f.required}
                  type={f.number ? "number" : "text"}
                  min={f.number ? 0 : undefined}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2"
                />
              )}
            </label>
          ))}
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground">
              إرسال للمراجعة
            </button>
            {form["id"] && (
              <button type="button" onClick={() => setForm({})} className="rounded-xl border px-4">
                إلغاء
              </button>
            )}
          </div>
          {msg && <p className="rounded-xl bg-secondary p-3 text-center text-sm">{msg}</p>}
        </form>

        <section>
          <h3 className="mb-2 font-display text-lg font-bold">
            {kind === "courses" ? "دوراتي" : "منتجاتي"}
          </h3>
          {mine.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {kind === "courses" ? "لم تقدّم أي دورة بعد." : "لم تنشر أي منتج بعد."}
            </p>
          )}
          <div className="space-y-2">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <div className="min-w-0">
                  <p className="truncate font-bold">{r[titleKey]}</p>
                  <span
                    className={`rounded-full px-2 text-xs ${
                      r.status === "approved"
                        ? "bg-secondary text-primary"
                        : r.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button aria-label="تعديل" onClick={() => setForm(r)} className="text-primary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button aria-label="حذف" onClick={() => remove(r.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {kind === "courses" ? (
          <>
            عندك منتج تبي تبيّعه؟{" "}
            <Link to="/contribute/products" className="font-bold text-primary">
              انشر منتجاتك
            </Link>
          </>
        ) : (
          <>
            تريد تعليم زملائك؟{" "}
            <Link to="/contribute/courses" className="font-bold text-primary">
              قدّم دوراتك
            </Link>
          </>
        )}
      </p>
    </>
  );
}
