import { LoadingSkeleton,TableSkeleton } from "@/components/LoadingSkeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, QrCode, Tag, History, Store, Plus, Pencil, Trash2, X, CheckCircle2, XCircle, Camera, MapPin, ArrowLeft, ShieldCheck, Upload, Search, Loader2, Clock3, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cities } from "@/lib/turkey-universities";
import { businessCategories, fetchMyBusiness, uploadLogo, BusinessLogo, statusLabels, type Business } from "@/lib/business";
import { lookupStudent, confirmDiscount, myRedemptions, type ScannedStudent } from "@/lib/business.functions";
import { parseStudentQr } from "@/lib/membership";
import { QrScanner } from "@/components/QrScanner";
import { UniversityLogo } from "@/components/UniversityLogo";
import logo from "@/assets/union-logo.png.asset.json";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/business")({
  staticData: { sitemap: false },
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

const input = "mt-2 h-11 w-full min-w-0 rounded-lg border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

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

  if (!uid || isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo.url} alt="اتحاد الطلبة" className="h-11 w-11 shrink-0 object-contain" />
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold sm:text-xl">لوحة أصحاب الأعمال</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">الاتحاد العام لطلبة سوريا</p>
            </div>
          </div>
          <Button onClick={signOut} variant="ghost" aria-label="تسجيل الخروج" title="تسجيل الخروج" className="shrink-0 text-muted-foreground"><LogOut /> <span className="hidden sm:inline">تسجيل الخروج</span></Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {!biz ? (
          <BusinessForm uid={uid} onSaved={() => qc.invalidateQueries({ queryKey: ["my-business"] })} />
        ) : biz.status !== "approved" ? (
          <div className="space-y-5">
            <div className="rounded-lg border bg-card p-6 text-center">
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
    name: existing?.name ?? "", category: existing?.category ?? businessCategories[0] ?? "أخرى", city: existing?.city ?? "",
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
    <form onSubmit={save} className="grid min-w-0 gap-5 md:grid-cols-2">
      <h2 className="border-b pb-4 font-display text-xl font-bold md:col-span-2">{existing ? "معلومات المتجر" : "معلومات نشاطك التجاري"}</h2>
      <div className="flex items-center gap-4 border-b pb-5 md:col-span-2">
        <BusinessLogo path={f.logo_url} name={f.name || "؟"} className="h-20 w-20" />
        <div><Button asChild variant="outline" disabled={busy}><label className="cursor-pointer"><Upload />{busy ? "جارٍ الرفع..." : "رفع الشعار"}<input type="file" accept="image/*" disabled={busy} className="hidden" onChange={(e) => pickLogo(e.target.files?.[0])} /></label></Button><p className="mt-2 text-xs text-muted-foreground">شعار المتجر</p></div>
      </div>
      <label className="text-sm">اسم النشاط<input required value={f.name} onChange={(e) => set("name", e.target.value)} className={input} /></label>
      <label className="text-sm">النوع<select value={f.category} onChange={(e) => set("category", e.target.value)} className={input}>{businessCategories.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">المدينة<select required value={f.city} onChange={(e) => set("city", e.target.value)} className={input}><option value="">اختر المدينة</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">العنوان / الموقع<input required value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="الحي، الشارع، رقم المبنى" className={input} /></label>
      <label className="text-sm">رقم التواصل<input required type="tel" dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={input} /></label>
      <label className="text-sm">البريد الإلكتروني<input type="email" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} className={input} /></label>
      <label className="text-sm md:col-span-2">نبذة<textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} className={`${input} h-auto`} /></label>
      <Button disabled={busy} className="h-11 md:col-span-2 md:w-fit">{busy && <Loader2 className="animate-spin" />}{existing ? "حفظ التعديلات" : "إرسال طلب التسجيل"}</Button>
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
  const published = deals.filter((deal) => deal.active && deal.staff_active && deal.status === "approved").length;
  const pending = deals.filter((deal) => deal.status === "pending").length;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
      <aside className="min-w-0 lg:sticky lg:top-6">
        <div className="flex items-center gap-3 border-b pb-5 lg:flex-col lg:items-start">
          <BusinessLogo path={biz.logo_url} name={biz.name} className="h-16 w-16" />
          <div className="min-w-0"><h2 className="break-words font-display text-xl font-bold">{biz.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{biz.city} · {biz.category}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"><ShieldCheck className="h-3.5 w-3.5" />{biz.active ? "متجر معتمد" : "المتجر غير فعّال"}</span></div>
        </div>
        <nav aria-label="أقسام لوحة المتجر" className="mt-4 grid grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-2">
          {tabs.map(({ k, label, icon: Icon }) => (
            <Button key={k} onClick={() => setTab(k)} variant="ghost" aria-current={tab === k ? "page" : undefined} className={`h-auto min-h-16 flex-col gap-2 whitespace-normal rounded-lg px-1 py-3 text-[11px] lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm ${tab === k ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Icon className="h-5 w-5" />{label}<ChevronLeft className="ms-auto hidden lg:block" /></Button>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col gap-7">
        <div className={`grid grid-cols-3 divide-x divide-x-reverse border-y py-4 ${tab === "scan" ? "order-2" : ""}`}>
          {[{label:"إجمالي العروض",value:deals.length,icon:Tag},{label:"عروض منشورة",value:published,icon:CheckCircle2},{label:"قيد المراجعة",value:pending,icon:Clock3}].map(({label,value,icon:Icon}) => <div key={label} className="px-3 first:ps-0 sm:px-6"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="hidden h-4 w-4 sm:block" /><span className="text-xs">{label}</span></div><p className="mt-2 font-display text-2xl font-bold sm:text-3xl">{value}</p></div>)}
        </div>
        {tab === "scan" && <ScanTab deals={deals} />}
        {tab === "deals" && <DealsTab biz={biz} deals={deals} refresh={() => qc.invalidateQueries({ queryKey: ["biz-deals", biz.id] })} />}
        {tab === "history" && <HistoryTab />}
        {tab === "info" && <BusinessForm uid={uid} existing={biz} onSaved={() => qc.invalidateQueries({ queryKey: ["my-business"] })} />}
      </div>
    </div>
  );
}

function ScanTab({ deals }: { deals: any[] }) {
  const lookup = useServerFn(lookupStudent);
  const confirm = useServerFn(confirmDiscount);
  const active = deals.filter((d) => d.active);
  const [scanning, setScanning] = useState(true);
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
    <section className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold">التحقق من عضوية الطالب</h2><p className="mt-2 text-sm text-muted-foreground">تقديم التخفيض للطلاب أصحاب العضوية الفعّالة</p></div>
      {active.length === 0 && <p className="rounded-lg border border-accent bg-accent/10 p-3 text-sm">أضف عرضاً من تبويب «عروضي» أولاً.</p>}
      <div className="grid gap-6 border-y py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-8">
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border bg-card p-3 text-center sm:p-4">
          {scanning ? <><QrScanner onResult={open} /><Button variant="ghost" onClick={() => setScanning(false)}>إيقاف الكاميرا</Button></> : <><div className="relative grid h-24 w-24 place-items-center rounded-lg border-2 border-primary/30 bg-secondary/40"><QrCode className="h-14 w-14 text-primary" /></div><Button disabled={busy} onClick={() => { setMsg(""); setScanning(true); }} className="h-11 w-full max-w-64"><Camera />{msg ? "مسح الطالب التالي" : "امسح رمز الطالب"}</Button></>}
        </div>
        <div className="flex flex-col justify-center"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><Search className="h-4 w-4 text-primary" />البحث برقم العضوية</div><form onSubmit={(e) => { e.preventDefault(); open(manual); }} className="space-y-3"><label className="text-sm text-muted-foreground" htmlFor="member-code">رقم الطالب</label><input id="member-code" value={manual} onChange={(e) => setManual(e.target.value)} dir="ltr" placeholder="GUSS-2026-00000" className={input} /><Button variant="outline" disabled={busy || !manual.trim()} className="h-11 w-full">{busy ? <Loader2 className="animate-spin" /> : <ArrowLeft />}التحقق من العضوية</Button></form></div>
      </div>
      {msg && <p className="text-sm font-bold">{msg}</p>}

      <Dialog open={Boolean(student)} onOpenChange={(open) => { if (!open) setStudent(null); }}>
        {student && <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg bg-card text-center">
            <DialogTitle className="font-display">بيانات الطالب</DialogTitle><DialogDescription>نتيجة التحقق من العضوية</DialogDescription>
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
                <Button disabled={busy || !dealId} onClick={approve} className="h-11 w-full">{busy && <Loader2 className="animate-spin" />}موافق — تقديم التخفيض</Button>
              </>
            )}
        </DialogContent>}
      </Dialog>
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
        <Button onClick={() => { setErr(""); setEditing({ active: true }); }}><Plus />عرض جديد</Button>
      </div>
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      {deals.length === 0 && <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center"><Tag className="h-8 w-8 text-muted-foreground" /><p className="font-bold">لا توجد عروض بعد</p></div>}
      <div className="grid gap-4 xl:grid-cols-2">
        {deals.map((d) => (
          <article key={d.id} className="min-w-0 rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-3"><span className="max-w-[65%] break-words font-display text-2xl font-bold text-primary">{d.discount}</span><span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${d.status === "pending" ? "bg-accent/20 text-accent-foreground" : d.status === "rejected" ? "bg-destructive/10 text-destructive" : d.active && d.staff_active ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>{d.status === "pending" ? "بانتظار الموافقة" : d.status === "rejected" ? "مرفوض" : d.active && d.staff_active ? "منشور" : "متوقف"}</span></div>
            <p className="mt-4 break-words text-sm leading-7">{d.terms || "بدون شروط"}</p>
            <div className="mt-5 flex items-center justify-between gap-2 border-t pt-3"><span className="text-xs text-muted-foreground">{d.category}</span><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="تعديل العرض" title="تعديل العرض" onClick={() => { setErr(""); setEditing(d); }}><Pencil /></Button><Button variant="ghost" size="icon" aria-label="حذف العرض" title="حذف العرض" onClick={() => remove(d.id)} className="text-destructive"><Trash2 /></Button></div></div>
          </article>
        ))}
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing && <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-card">
          <DialogTitle className="ps-5 font-display">{editing.id ? "تعديل العرض" : "عرض جديد"}</DialogTitle><DialogDescription>العروض الجديدة والتعديلات تخضع لموافقة الإدارة.</DialogDescription>
          <form onSubmit={(e) => { e.preventDefault(); save(editing); }} className="space-y-4">
            <label className="block text-sm">قيمة الخصم<input required value={editing.discount ?? ""} onChange={(e) => setEditing({ ...editing, discount: e.target.value })} placeholder="20% أو قهوة مجانية" className={input} /></label>
            <label className="block text-sm">الشروط<textarea rows={3} value={editing.terms ?? ""} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} placeholder="مثال: على الطلبات داخل المحل فقط" className={`${input} h-auto`} /></label>
            <label className="flex items-center justify-between gap-3 border-y py-4 text-sm">إتاحة العرض بعد موافقة الإدارة<Switch checked={editing.active ?? true} onCheckedChange={(active) => setEditing({ ...editing, active })} aria-label="إتاحة العرض بعد موافقة الإدارة" /></label>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2"><Button className="h-11 flex-1">حفظ العرض</Button><Button type="button" variant="outline" className="h-11" onClick={() => setEditing(null)}>إلغاء</Button></div>
          </form>
        </DialogContent>}
      </Dialog>
    </section>
  );
}

function HistoryTab() {
  const list = useServerFn(myRedemptions);
  const { data = [], isLoading } = useQuery({ queryKey: ["biz-history"], queryFn: () => list() });
  const unique = new Set(data.map((r) => r.memberCode)).size;
  return (
    <section>
      <h2 className="mb-5 font-display text-2xl font-bold">سجل التخفيضات</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center"><p className="font-display text-3xl font-bold text-primary">{data.length}</p><p className="text-sm text-muted-foreground">تخفيض مقدَّم</p></div>
        <div className="rounded-lg border bg-card p-4 text-center"><p className="font-display text-3xl font-bold text-primary">{unique}</p><p className="text-sm text-muted-foreground">طالب مستفيد</p></div>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-secondary text-right"><tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">الجامعة</th><th className="px-4 py-3">الخصم</th><th className="px-4 py-3">التاريخ</th></tr></thead>
          <tbody>
            {isLoading && <TableSkeleton columns={4} />}
            {!isLoading && data.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">لا توجد تخفيضات مسجّلة بعد</td></tr>}
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
