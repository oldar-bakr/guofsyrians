import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { UserDetailsDialog } from "@/components/UserDetailsDialog";
import { listUsers, setUserRole, setUserBlocked, deleteUser, setMembership, type ManagedRole, type ManagedUser } from "@/lib/users.functions";

const roleLabels: Record<ManagedRole, string> = { admin: "مدير", editor: "محرر", user: "طالب" };
const roleHelp = [
  { role: "مدير", text: "يدير كل المحتوى والمستخدمين والصلاحيات" },
  { role: "محرر", text: "يضيف ويعدّل المحتوى فقط، دون إدارة المستخدمين" },
  { role: "طالب", text: "يستخدم التطبيق دون دخول لوحة الإدارة" },
];

export function UsersManager({ myId }: { myId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const changeRole = useServerFn(setUserRole);
  const block = useServerFn(setUserBlocked);
  const remove = useServerFn(deleteUser);
  const membership = useServerFn(setMembership);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<ManagedUser | null>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  const q = search.toLowerCase();
  const users = data.filter((u) => u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q) || u.university.toLowerCase().includes(q));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">المستخدمون <span className="text-base text-muted-foreground">({data.length})</span></h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الجامعة..." className="rounded-xl border bg-card px-4 py-2 text-sm" />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {roleHelp.map((r) => (
          <div key={r.role} className="rounded-2xl bg-card p-4 text-sm shadow-soft">
            <p className="font-bold text-primary">{r.role}</p>
            <p className="text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>

      {error && <p className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-right">
            <tr>
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">الجامعة</th>
              <th className="px-4 py-3">طريقة الدخول</th>
              <th className="px-4 py-3">آخر دخول</th>
              <th className="px-4 py-3">الصلاحية</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">العضوية</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={8}>جارٍ التحميل...</td></tr>}
            {users.map((u) => {
              const me = u.id === myId;
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setOpen(u)} title="عرض وتعديل البيانات" className="flex items-center gap-2 text-right hover:opacity-80">
                      <Avatar path={u.avatarUrl} name={u.fullName} university={u.university} className="h-9 w-9" textClass="text-xs" />
                      <div className="min-w-0">
                        <p className="font-bold underline-offset-2 hover:underline">{u.fullName || "— لم يكمل بياناته —"}{me && <span className="mr-2 text-xs text-primary">(أنت)</span>}{u.isOwner && <span className="mr-2 rounded-full bg-accent px-2 text-xs text-accent-foreground">المالك</span>}</p>
                        <p className="text-xs text-muted-foreground">{u.email}{u.phone && ` · ${u.phone}`}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3">{u.university}{u.city && <span className="block text-xs text-muted-foreground">{u.city}</span>}</td>
                  <td className="px-4 py-3">{u.provider === "google" ? "Google" : "البريد"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString("ar") : "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      disabled={me || u.isOwner}
                      value={u.role}
                      onChange={(e) => run(() => changeRole({ data: { userId: u.id, role: e.target.value as ManagedRole } }))}
                      className="rounded-lg border bg-background px-2 py-1 disabled:opacity-60"
                    >
                      {(Object.keys(roleLabels) as ManagedRole[]).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? <span className="font-bold text-destructive">موقوف</span> : <span className="text-primary">فعّال</span>}
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={u.membershipActive} onChange={(e) => run(() => membership({ data: { userId: u.id, active: e.target.checked, expires: u.membershipExpires } }))} />
                      {u.membershipActive ? "مدفوعة" : "غير مفعّلة"}
                    </label>
                    {u.membershipActive && (
                      <input type="date" title="تنتهي في" defaultValue={u.membershipExpires ?? ""} onBlur={(e) => e.target.value !== (u.membershipExpires ?? "") && run(() => membership({ data: { userId: u.id, active: true, expires: e.target.value || null } }))} className="mt-1 rounded border bg-background px-1 text-xs" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!me && !u.isOwner && (
                      <div className="flex gap-3">
                        <button
                          aria-label={u.banned ? "إعادة تفعيل" : "إيقاف"}
                          title={u.banned ? "إعادة تفعيل" : "إيقاف"}
                          onClick={() => run(() => block({ data: { userId: u.id, blocked: !u.banned } }))}
                          className={u.banned ? "text-primary" : "text-accent-foreground"}
                        >
                          {u.banned ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button
                          aria-label="حذف"
                          title="حذف"
                          onClick={() => confirm(`حذف ${u.email} نهائياً؟`) && run(() => remove({ data: { userId: u.id } }))}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && <UserDetailsDialog user={open} onClose={() => setOpen(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />}
    </section>
  );
}
