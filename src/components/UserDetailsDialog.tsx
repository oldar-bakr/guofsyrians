import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { CityUniversitySelect } from "@/components/CityUniversitySelect";
import { getUserDetails, updateUserDetails, type ManagedUser, type ManagedRole } from "@/lib/users.functions";

const roleLabels: Record<ManagedRole, string> = { admin: "مدير", editor: "محرر", user: "طالب" };
const textFields = [
  { key: "full_name", label: "الاسم الكامل" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "student_number", label: "الرقم الجامعي" },
  { key: "uni_email", label: "البريد الجامعي" },
  { key: "member_code", label: "رقم العضوية" },
];

export function UserDetailsDialog({ user, onClose, onSaved }: { user: ManagedUser; onClose: () => void; onSaved: () => void }) {
  const load = useServerFn(getUserDetails);
  const save = useServerFn(updateUserDetails);
  const [email, setEmail] = useState(user.email);
  const [form, setForm] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<Record<string, string | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load({ data: { userId: user.id } })
      .then((d) => {
        setEmail(d.email);
        setMeta(d.profile);
        const f: Record<string, string> = {};
        for (const [k, v] of Object.entries(d.profile ?? {})) f[k] = v ?? "";
        setForm(f);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "حدث خطأ"))
      .finally(() => setLoading(false));
  }, [user.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({ data: { userId: user.id, email, profile: form } });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border bg-background px-3 py-2 disabled:opacity-60";
  const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("ar") : "—");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="بيانات المستخدم" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar path={user.avatarUrl} name={user.fullName} className="h-14 w-14" />
            <div>
              <h3 className="font-display text-xl font-bold">{user.fullName || "— لم يكمل بياناته —"}</h3>
              <p className="text-xs text-muted-foreground">{roleLabels[user.role]} · {user.banned ? "موقوف" : "فعّال"} · {user.provider === "google" ? "Google" : "البريد"}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 grid gap-2 rounded-xl bg-secondary p-3 text-xs sm:grid-cols-3">
          <p>تاريخ التسجيل: <b>{fmt(user.createdAt)}</b></p>
          <p>آخر دخول: <b>{fmt(user.lastSignIn)}</b></p>
          <p>آخر تعديل للبيانات: <b>{fmt(meta?.["updated_at"])}</b></p>
        </div>

        {loading ? <p>جارٍ التحميل...</p> : (
          <form onSubmit={submit} className="grid gap-3 text-sm sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">البريد الإلكتروني (للدخول)</span>
              <input type="email" value={email} disabled={user.isOwner} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            {textFields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-muted-foreground">{f.label}</span>
                <input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={input} />
              </label>
            ))}
            <div className="sm:col-span-2">
              <CityUniversitySelect city={form["city"] ?? ""} university={form["university"] ?? ""} faculty={form["faculty"] ?? ""} department={form["department"] ?? ""} onChange={(v) => setForm({ ...form, ...v })} labelClassName="mb-1 block text-muted-foreground" className={input} />
            </div>
            {!meta && <p className="text-xs text-muted-foreground sm:col-span-2">هذا المستخدم لم يكمل بياناته بعد — الحفظ سينشئ ملفه.</p>}
            {error && <p className="rounded-xl bg-destructive/10 p-3 text-destructive sm:col-span-2">{error}</p>}
            <div className="flex gap-3 sm:col-span-2">
              <button disabled={busy} className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground disabled:opacity-60">{busy ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
              <button type="button" onClick={onClose} className="rounded-xl border px-6 py-2">إلغاء</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
