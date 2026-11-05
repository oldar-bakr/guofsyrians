import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, QrCode, Tag, History, Store, Plus, Pencil, Trash2, X, CheckCircle2, XCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cities } from "@/lib/turkey-universities";
import { businessCategories, fetchMyBusiness, uploadLogo, BusinessLogo, statusLabels, type Business } from "@/lib/business";
import { lookupStudent, confirmDiscount, myRedemptions, type ScannedStudent } from "@/lib/business.functions";
import { parseStudentQr } from "@/lib/membership";
import { QrScanner } from "@/components/QrScanner";
import { UniversityLogo } from "@/components/UniversityLogo";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/business")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة أصحاب الأعمال | تطبيق خدمات الطلاب" },
      { name: "description", content: "أضف تخفيضات متجرك للطلاب وامسح رموزهم للتحقق من العضوية." },
      { property: "og:title", content: "لوحة أصحاب الأعمال" },
      { property: "og:description", content: "قدّم تخفيضات لطلاب الاتحاد العام لطلبة سوريا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessPage,
});

const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2";

function BusinessPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth", search: { as: "business" }, replace: true });
      else setUid(data.user.id);
    });
  }, [navigate]);
  const { data: biz, isLoading } = useQuery({ queryKey: ["my-business"], queryFn: fetchMyBusiness, enabled: !!uid });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { as: "business" }, replace: true });
  };

  if (!uid || isLoading) return <div className="grid min-h-screen place-items-center">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {biz ? <BusinessLogo path={biz.logo_url} name={biz.name} className="h-11 w-11" /> : <img src={logo.url} alt="" className="h-10 w-10 rounded-full bg-card object-contain p-1" />}
            <div>
              <h1 className="font-display text-xl font-bold">{biz?.name ?? "تسجيل متجر جديد"}</h1>
              <p className="text-xs opacity-80">لوحة أصحاب الأعمال{biz ? ` · ${statusLabels[biz.status] ?? biz.status}` : ""}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground"><LogOut className="h-4 w-4" />خروج</button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-5">
        {!biz ? (
          <BusinessForm uid={uid} onSaved={() => qc.invalidateQueries({ queryKey: ["my-business"] })} />
        ) : biz.status !== "approved" ? (
          <div className="space-y-5">
            <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
              <p className="font-display text-xl font-bold">{biz.status === "rejected" ? "لم تتم الموافقة على متجرك" : "طلبك قيد المراجعة"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{biz.status === "rejected" ? "تواصل مع إدارة الاتحاد لمعرفة السبب." : "ستتمكن من نشر التخفيضات ومسح رموز الطلاب بعد موافقة إدارة الاتحاد."}</p>
            </div>
            <BusinessForm uid={uid} existing={biz} onSaved={() => qc.invalidateQueries({ queryKey: ["my-business"] })} />
          </div>
        ) : (
          <Dashboard biz={biz} uid={uid} />
        )}
      </main>
    </div>
  );
}

function BusinessForm({ uid, existing, onSaved }: { uid: string; existing?: Business; onSaved: () => void }) {
  const [f, setF] = useState({
    name: existing?.name ?? "", category: existing?.category ?? businessCategories[0]!, city: existing?.city ?? "",
    address: existing?.address ?? "", phone: existing?.phone ?? "", email: existing?.email ?? "", description: existing?.description ?? "",
    logo_url: existing?.logo_url ?? null as string | null,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try { setF({ ...f, logo_url: await uploadLogo(uid, file) }); } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.city) return setMsg("اختر المدينة");
    setBusy(true);
    setMsg("");
    const { error } = existing
      ? await supabase.from("businesses").update(f).eq("id", existing.id)
      : await supabase.from("businesses").insert({ ...f, owner_id: uid });
    setBusy(false);
    if (error) return setMsg("تعذّر الحفظ: " + error.message);
    setMsg("تم الحفظ");
    onSaved();
  };

  return (
    <form onSubmit={save} className="grid gap-4 rounded-3xl bg-card p-6 shadow-soft md:grid-cols-2">
      <h2 className="font-display text-xl font-bold md:col-span-2">{existing ? "معلومات المتجر" : "معلومات نشاطك التجاري"}</h2>
      <div className="flex items-center gap-4 md:col-span-2">
        <BusinessLogo path={f.logo_url} name={f.name || "؟"} className="h-20 w-20" />
        <label className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold">
          {busy ? "جارٍ الرفع..." : "رفع الشعار"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pickLogo(e.target.files?.[0])} />
        </label>
      </div>
      <label className="text-sm">اسم النشاط<input required value={f.name} onChange={(e) => set("name", e.target.value)} className={input} /></label>
      <label className="text-sm">النوع<select value={f.category} onChange={(e) => set("category", e.target.value)} className={input}>{businessCategories.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">المدينة<select required value={f.city} onChange={(e) => set("city", e.target.value)} className={input}><option value="">اختر المدينة</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">العنوان / الموقع<input required value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="الحي، الشارع، رقم المبنى" className={input} /></label>
      <label className="text-sm">رقم التواصل<input required type="tel" dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={input} /></label>
      <label className="text-sm">البريد الإلكتروني<input type="email" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} className={input} /></label>
      <label className="text-sm md:col-span-2">نبذة<textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} className={input} /></label>
      <button disabled={busy} className="rounded-xl bg-primary py-2 font-bold text-primary-foreground disabled:opacity-60 md:col-span-2">{existing ? "حفظ التعديلات" : "إرسال طلب التسجيل"}</button>
      {msg && <p className="text-center text-sm text-muted-foreground md:col-span-2">{msg}</p>}
    </form>
  );
}

type Tab = "scan" | "deals" | "history" | "info";

function Dashboard({ biz, uid }: { biz: Business; uid: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("scan");
  const { data: deals = [] } = useQuery({
    queryKey: ["biz-deals", biz.id],
    queryFn: async () => (await supabase.from("deals").select("*").eq("business_id", biz.id).order("created_at")).data ?? [],
  });
  const tabs: { k: Tab; label: string; icon: any }[] = [
    { k: "scan", label: "مسح رمز الطالب", icon: QrCode },
    { k: "deals", label: "عروضي", icon: Tag },
    { k: "history", label: "السجل", icon: History },
    { k: "info", label: "معلومات المتجر", icon: Store },
  ];
  return (
    <>
      <nav className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(({ k, label, icon: Icon }) => (
          <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm ${tab === k ? "bg-primary font-bold text-primary-foreground" : "bg-card"}`}><Icon className="h-4 w-4" />{label}</button>
        ))}
      </nav>
      {tab === "scan" && <ScanTab deals={deals} />}
      {tab === "deals" && <DealsTab biz={biz} deals={deals} refresh={() => qc.invalidateQueries({ queryKey: ["biz-deals", biz.id] })} />}
      {tab === "history" && <HistoryTab />}
      {tab === "info" && <BusinessForm uid={uid} existing={biz} onSaved={() => qc.invalidateQueries({ queryKey: ["my-business"] })} />}
    </>
  );
}

function ScanTab({ deals }: { deals: any[] }) {
  const lookup = useServerFn(lookupStudent);
  const confirm = useServerFn(confirmDiscount);
  const active = deals.filter((d) => d.active);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [code, setCode] = useState("");
  const [student, setStudent] = useState<ScannedStudent | null>(null);
  const [dealId, setDealId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const open = async (raw: string) => {
    setScanning(false);
    setMsg("");
    const parsed = parseStudentQr(raw) ?? (raw.trim() ? { code: raw.trim(), dealId: null } : null);
    if (!parsed) return setMsg("هذا ليس رمز طالب من الاتحاد");
    setBusy(true);
    try {
      const s = await lookup({ data: { code: parsed.code } });
      setCode(parsed.code);
      setStudent(s);
      const fromQr = parsed.dealId && active.find((d) => d.id === parsed.dealId);
      setDealId(fromQr ? fromQr.id : active[0]?.id ?? "");
    } catch (e: any) {
      setMsg(e.message);
    }
    setBusy(false);
  };

  const approve = async () => {
    if (!dealId) return setMsg("اختر العرض");
    setBusy(true);
    try {
      await confirm({ data: { code, dealId } });
      setStudent(null);
      setMsg("✓ تم تقديم التخفيض وتسجيله في السجل");
    } catch (e: any) {
      setMsg(e.message);
    }
    setBusy(false);
  };

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-3xl bg-card p-6 text-center shadow-soft">
      {active.length === 0 && <p className="rounded-xl bg-accent/30 p-3 text-sm">أضف عرضاً من تبويب «عروضي» أولاً.</p>}
      {scanning ? (
        <>
          <QrScanner onResult={open} />
          <button onClick={() => setScanning(false)} className="text-sm text-muted-foreground">إلغاء</button>
        </>
      ) : (
        <button disabled={busy} onClick={() => setScanning(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-6 font-display text-lg font-bold text-primary-foreground"><Camera className="h-6 w-6" />امسح رمز الطالب</button>
      )}
      <form onSubmit={(e) => { e.preventDefault(); open(manual); }} className="flex gap-2">
        <input value={manual} onChange={(e) => setManual(e.target.value)} dir="ltr" placeholder="GUSS-2026-00000" className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm" />
        <button className="rounded-xl border px-3 text-sm">بحث</button>
      </form>
      {msg && <p className="text-sm font-bold">{msg}</p>}

      {student && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 text-center shadow-soft">
            <button onClick={() => setStudent(null)} aria-label="إغلاق" className="float-left"><X className="h-5 w-5" /></button>
            <div className="relative mx-auto w-fit">{student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="h-24 w-24 rounded-full object-cover" /> : <span className="grid h-24 w-24 place-items-center rounded-full bg-secondary font-display text-3xl font-bold text-primary">{student.name.slice(0, 1)}</span>}<UniversityLogo university={student.university} className="absolute -bottom-1 -left-1 h-9 w-9" /></div>
            <div>
              <p className="font-display text-xl font-bold">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.university}{student.faculty && ` · ${student.faculty}`}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{student.memberCode} · {student.city}</p>
            </div>
            <p className={`flex items-center justify-center gap-2 rounded-xl p-3 font-bold ${student.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {student.active ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {student.active ? `العضوية فعّالة${student.expires ? ` حتى ${student.expires}` : ""}` : "العضوية غير فعّالة — لا يحق له التخفيض"}
            </p>
            <p className="text-xs text-muted-foreground">استفاد من متجرك {student.usesHere} مرة سابقاً</p>
            {student.active && (
              <>
                <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2">
                  {active.map((d) => <option key={d.id} value={d.id}>{d.discount} — {d.terms}</option>)}
                </select>
                <button disabled={busy || !dealId} onClick={approve} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">موافق — تقديم التخفيض</button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DealsTab({ biz, deals, refresh }: { biz: Business; deals: any[]; refresh: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [err, setErr] = useState("");
  const save = async (d: any) => {
    const row = { discount: d.discount ?? "", terms: d.terms ?? "", category: d.category || biz.category, active: d.active ?? true, partner: biz.name, city: biz.city, business_id: biz.id };
    const { error } = d.id ? await supabase.from("deals").update(row).eq("id", d.id) : await supabase.from("deals").insert(row);
    if (error) return setErr("تعذّر الحفظ: " + error.message);
    setEditing(null);
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف العرض؟")) return;
    await supabase.from("deals").delete().eq("id", id);
    refresh();
  };
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">عروضي ({deals.length})</h2>
        <button onClick={() => setEditing({ active: true })} className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />عرض جديد</button>
      </div>
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {deals.map((d) => (
          <article key={d.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent font-display text-lg font-bold text-accent-foreground">{d.discount}</span>
            <div className="flex-1">
              <p className="font-bold">{d.terms || "بدون شروط"}</p>
              <p className="text-xs text-muted-foreground">{d.category} · {d.active ? "منشور" : "متوقف"}</p>
            </div>
            <button aria-label="تعديل" onClick={() => setEditing(d)} className="text-primary"><Pencil className="h-4 w-4" /></button>
            <button aria-label="حذف" onClick={() => remove(d.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <form onSubmit={(e) => { e.preventDefault(); save(editing); }} className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6 shadow-soft">
            <div className="flex justify-between"><h3 className="font-display text-lg font-bold">{editing.id ? "تعديل العرض" : "عرض جديد"}</h3><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
            <label className="block text-sm">قيمة الخصم<input required value={editing.discount ?? ""} onChange={(e) => setEditing({ ...editing, discount: e.target.value })} placeholder="20% أو قهوة مجانية" className={input} /></label>
            <label className="block text-sm">الشروط<textarea rows={3} value={editing.terms ?? ""} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} placeholder="مثال: على الطلبات داخل المحل فقط" className={input} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />منشور للطلاب</label>
            <button className="w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">حفظ</button>
          </form>
        </div>
      )}
    </section>
  );
}

function HistoryTab() {
  const list = useServerFn(myRedemptions);
  const { data = [], isLoading } = useQuery({ queryKey: ["biz-history"], queryFn: () => list() });
  const unique = new Set(data.map((r) => r.memberCode)).size;
  return (
    <section>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><p className="font-display text-3xl font-bold text-primary">{data.length}</p><p className="text-sm text-muted-foreground">تخفيض مقدَّم</p></div>
        <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><p className="font-display text-3xl font-bold text-primary">{unique}</p><p className="text-sm text-muted-foreground">طالب مستفيد</p></div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-right"><tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">الجامعة</th><th className="px-4 py-3">الخصم</th><th className="px-4 py-3">التاريخ</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4">جارٍ التحميل...</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={4} className="p-4 text-muted-foreground">لا يوجد سجل بعد</td></tr>}
            {data.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.student}<span className="block text-xs text-muted-foreground" dir="ltr">{r.memberCode}</span></td>
                <td className="px-4 py-3">{r.university}</td>
                <td className="px-4 py-3">{r.discount}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleString("ar")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
