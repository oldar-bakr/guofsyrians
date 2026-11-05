import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels } from "@/lib/content";
import { useMyProfile } from "@/lib/profile";

export type ContributeKind = "courses" | "products";

type Field = { key: string; label: string; long?: boolean; number?: boolean; required?: boolean; list?: string };

export const COURSE_CATEGORIES = [
  "برمجة وتقنية", "تصميم", "لغات", "إدارة وأعمال", "تسويق", "مهارات شخصية",
  "هندسة", "طب وصحة", "علوم", "رياضيات", "تحضير امتحانات", "أخرى",
];

const defs: Record<ContributeKind, { label: string; fields: Field[] }> = {
  courses: {
    label: "دورة",
    fields: [
      { key: "title", label: "اسم الدورة", required: true },
      { key: "category", label: "التصنيف (اختر أو اكتب)", list: "course-categories" },
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

const inputCls = "mt-1 w-full rounded-xl border bg-background px-3 py-2";

/** One link input per lesson, count follows the lessons number. */
export function LessonVideosInput({ count, value, onChange }: { count: number; value: string[]; onChange: (v: string[]) => void }) {
  const n = Math.max(0, Math.min(100, Math.floor(count || 0)));
  if (n === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
      <p className="text-sm font-bold">روابط فيديوهات الدروس</p>
      {Array.from({ length: n }, (_, i) => (
        <label key={i} className="block text-xs">
          رابط فيديو الدرس {i + 1}
          <input
            dir="ltr"
            type="url"
            placeholder="https://"
            value={value[i] ?? ""}
            onChange={(e) => {
              const next = Array.from({ length: n }, (_, j) => value[j] ?? "");
              next[i] = e.target.value;
              onChange(next);
            }}
            className={inputCls + " text-sm"}
          />
        </label>
      ))}
    </div>
  );
}

function FieldsEditor({ kind, form, setForm }: { kind: ContributeKind; form: Record<string, any>; setForm: (f: Record<string, any>) => void }) {
  return (
    <>
      {defs[kind].fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm">
            {f.label}
            {f.long ? (
              <textarea rows={4} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls} />
            ) : (
              <input
                required={f.required}
                type={f.number ? "number" : "text"}
                min={f.number ? 0 : undefined}
                max={f.number ? 100 : undefined}
                list={f.list}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className={inputCls}
              />
            )}
          </label>
          {kind === "courses" && f.key === "lessons" && (
            <div className="mt-2">
              <LessonVideosInput count={Number(form["lessons"]) || 0} value={form["lesson_videos"] ?? []} onChange={(v) => setForm({ ...form, lesson_videos: v })} />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function buildPayload(kind: ContributeKind, form: Record<string, any>) {
  const payload: Record<string, any> = {};
  defs[kind].fields.forEach((f) => (payload[f.key] = f.number ? Number(form[f.key] || 0) : form[f.key] ?? ""));
  if (kind === "courses") {
    const n = Math.max(0, Math.min(100, Math.floor(payload["lessons"] || 0)));
    payload["lesson_videos"] = Array.from({ length: n }, (_, i) => (form["lesson_videos"] ?? [])[i]?.trim() ?? "");
  }
  return payload;
}

function useMySubmissions(kind: ContributeKind) {
  return useQuery({
    queryKey: ["my-submissions", kind],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from(kind).select("*").eq("submitted_by", u.user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel }: { title: string; body?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm space-y-3 rounded-3xl bg-card p-6 text-center shadow-soft">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {body && <p className="text-sm text-muted-foreground">{body}</p>}
        <div className="flex gap-2">
          <button onClick={onConfirm} className={`flex-1 rounded-xl py-2 font-bold ${danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>{confirmLabel}</button>
          <button onClick={onCancel} className="flex-1 rounded-xl border py-2">تراجع</button>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ kind, row, titleKey }: { kind: ContributeKind; row: any; titleKey: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(row);
  const [confirm, setConfirm] = useState<null | "save" | "delete">(null);
  const [msg, setMsg] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-submissions", kind] });
    qc.invalidateQueries({ queryKey: ["content", kind] });
  };

  const doSave = async () => {
    setConfirm(null);
    const { error } = await supabase.from(kind).update(buildPayload(kind, form) as never).eq("id", row.id);
    if (error) return setMsg("تعذّر الحفظ: " + error.message);
    setMsg("");
    setOpen(false);
    refresh();
  };
  const doDelete = async () => {
    setConfirm(null);
    await supabase.from(kind).delete().eq("id", row.id);
    refresh();
  };

  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => { setForm(row); setOpen(!open); }} className="min-w-0 flex-1 text-right">
          <p className="truncate font-bold">{row[titleKey]}</p>
          <span className={`rounded-full px-2 text-xs ${row.status === "approved" ? "bg-secondary text-primary" : row.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
            {statusLabels[row.status] ?? row.status}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button aria-label="تعديل" onClick={() => { setForm(row); setOpen(!open); }} className="text-primary"><Pencil className="h-4 w-4" /></button>
          <button aria-label="حذف" onClick={() => setConfirm("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && (
        <form onSubmit={(e) => { e.preventDefault(); setConfirm("save"); }} className="mt-3 space-y-3 border-t pt-3">
          <FieldsEditor kind={kind} form={form} setForm={setForm} />
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground">حفظ</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4">إلغاء</button>
          </div>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
        </form>
      )}
      {confirm === "save" && (
        <ConfirmDialog title="حفظ التعديلات؟" body="سيعود للمراجعة ولن يظهر للطلاب حتى توافق الإدارة." confirmLabel="نعم، احفظ" onConfirm={doSave} onCancel={() => setConfirm(null)} />
      )}
      {confirm === "delete" && (
        <ConfirmDialog danger title={`حذف «${row[titleKey]}»؟`} body="لا يمكن التراجع عن الحذف." confirmLabel="نعم، احذف" onConfirm={doDelete} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

export function ContributeForm({ kind }: { kind: ContributeKind }) {
  const qc = useQueryClient();
  const { data: mine = [] } = useMySubmissions(kind);
  const { data: profile } = useMyProfile();
  const [form, setForm] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");
  const def = defs[kind];
  const titleKey = def.fields[0]!.key;
  const nameKey = kind === "courses" ? "instructor" : "seller";

  const profileDefaults = () => ({
    [nameKey]: profile?.full_name ?? "",
    contact: profile?.phone || profile?.uni_email || "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm((f) => (Object.keys(f).length > 0 ? f : profileDefaults()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from(kind).insert({ ...buildPayload(kind, form), submitted_by: u.user!.id } as never);
    if (error) return setMsg("تعذّر الإرسال: " + error.message);
    setForm(profileDefaults());
    setMsg("تم الإرسال، وسيظهر للطلاب بعد موافقة الإدارة.");
    qc.invalidateQueries({ queryKey: ["my-submissions", kind] });
    qc.invalidateQueries({ queryKey: ["content", kind] });
  };

  return (
    <>
      <datalist id="course-categories">
        {COURSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="font-display text-lg font-bold">إضافة {def.label}</h3>
          <p className="text-xs text-muted-foreground">
            تراجع الإدارة كل {def.label} قبل نشره. أي تعديل يعيده للمراجعة. اسمك وبيانات تواصلك تُملأ تلقائيًا من ملفك ويمكنك تعديلها.
          </p>
          <FieldsEditor kind={kind} form={form} setForm={setForm} />
          <button className="w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">إرسال للمراجعة</button>
          {msg && <p className="rounded-xl bg-secondary p-3 text-center text-sm">{msg}</p>}
        </form>

        <section>
          <h3 className="mb-2 font-display text-lg font-bold">{kind === "courses" ? "دوراتي" : "منتجاتي"}</h3>
          {mine.length === 0 && (
            <p className="text-sm text-muted-foreground">{kind === "courses" ? "لم تقدّم أي دورة بعد." : "لم تنشر أي منتج بعد."}</p>
          )}
          <p className="mb-2 text-xs text-muted-foreground">{mine.length > 0 && "اضغط على البطاقة لفتحها وتعديلها."}</p>
          <div className="space-y-2">
            {mine.map((r) => <SubmissionCard key={r.id + (r.updated_at ?? "")} kind={kind} row={r} titleKey={titleKey} />)}
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {kind === "courses" ? (
          <>عندك منتج تبي تبيّعه؟{" "}<Link to="/contribute/products" className="font-bold text-primary">انشر منتجاتك</Link></>
        ) : (
          <>تريد تعليم زملائك؟{" "}<Link to="/contribute/courses" className="font-bold text-primary">قدّم دوراتك</Link></>
        )}
      </p>
    </>
  );
}
