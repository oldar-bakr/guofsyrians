import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useMyProfile } from "@/lib/profile";
import { isMembershipActive } from "@/lib/membership";
import { CityUniversitySelect } from "@/components/CityUniversitySelect";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Avatar } from "@/components/Avatar";
import { removeAvatar, saveAvatarPath } from "@/lib/avatar";
import { useMine } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, Camera, MapPin, GraduationCap, BookOpen, CalendarDays, TicketPercent, ShoppingBag, ArrowLeft, Save, Loader2, LogOut, UserRound, CheckCircle2, CircleAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "ملفي الشخصي | تطبيق خدمات الطلاب" },
      { name: "description", content: "عدّل بياناتك الطلابية وتابع نشاطك." },
      { property: "og:title", content: "ملفي الشخصي" },
      { property: "og:description", content: "عدّل بياناتك الطلابية وتابع نشاطك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const fields = [
  { key: "full_name", label: "الاسم الكامل" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "city", label: "المدينة" },
  { key: "university", label: "الجامعة" },
  { key: "faculty", label: "الكلية" },
  { key: "department", label: "القسم / التخصص" },
  { key: "student_number", label: "الرقم الجامعي" },
  { key: "uni_email", label: "البريد الجامعي" },
] as const;

function ProfilePage() {
  const { data: p } = useMyProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const { data: courses = [] } = useMine("course_enrollments");
  const { data: events = [] } = useMine("event_registrations");
  const { data: deals = [] } = useMine("deal_redemptions");
  const { data: orders = [] } = useMine("orders");

  useEffect(() => {
    if (p) setForm(Object.fromEntries(fields.map((f) => [f.key, p[f.key] ?? ""])));
  }, [p]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p || saving) return;
    setMsg("");
    setSaveError(false);
    if (fields.some((f) => f.key !== "uni_email" && !form[f.key]?.trim())) { setSaveError(true); return setMsg("يرجى تعبئة جميع الحقول"); }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update(form as never).eq("id", p.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      setMsg("تم حفظ بياناتك");
    } catch { setSaveError(true); setMsg("تعذّر الحفظ، حاول مجدداً"); }
    finally { setSaving(false); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  const setAvatar = async (path: string | null) => {
    if (!p) return;
    try {
      if (path) await saveAvatarPath(p.id, path);
      else await removeAvatar(p.id);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["avatar-url"] });
    } catch (e) {
      setSaveError(true);
      setMsg(e instanceof Error ? e.message : "تعذّر حفظ الصورة");
    }
  };

  const stats = [
    { label: "دوراتي", n: courses.length, to: "/courses" as const, icon: BookOpen },
    { label: "فعالياتي", n: events.length, to: "/events" as const, icon: CalendarDays },
    { label: "عروض استخدمتها", n: deals.length, to: "/deals" as const, icon: TicketPercent },
    { label: "طلباتي", n: orders.length, to: "/market" as const, icon: ShoppingBag },
  ];
  const changed = Boolean(p && fields.some((f) => (form[f.key] ?? "") !== (p[f.key] ?? "")));
  const personalFields = fields.filter((f) => ["full_name", "phone", "student_number", "uni_email"].includes(f.key));
  const membershipActive = p ? isMembershipActive(p) : false;
  const membershipExpired = Boolean(p?.membership_expires && p.membership_expires < new Date().toISOString().slice(0, 10));
  const membershipDate = p?.membership_expires ? new Date(`${p.membership_expires}T12:00:00Z`).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null;

  return (
    <AppShell title="ملفي">
      <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center gap-5 border-b pb-6 pt-2 sm:gap-6">
        <div className="relative shrink-0 pb-1">
          <Avatar path={p?.avatar_url} name={p?.full_name} university={p?.university} className="h-24 w-24 ring-4 ring-card sm:h-28 sm:w-28" textClass="text-2xl" />
          <Button variant="outline" size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card shadow-sm" onClick={() => setPhotoOpen(true)} aria-label="تعديل الصورة الشخصية" title="تعديل الصورة الشخصية"><Camera className="h-4 w-4" /></Button>
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="mb-1 text-xs font-medium text-muted-foreground">ملفي الشخصي</p>
          <h1 className="break-words font-display text-2xl font-bold text-primary sm:text-3xl">{p?.full_name || "ملفي"}</h1>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{p?.university}</span></p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p?.city}</span><span dir="ltr" className="break-all font-mono">{p?.member_code}</span></div>
        </div>
        <Button asChild variant="outline" className="max-sm:ms-auto"><Link to="/card"><CreditCard />بطاقتي<ArrowLeft /></Link></Button>
        {p && <section aria-label="حالة العضوية" className="flex w-full flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex min-w-0 items-start gap-2">
            {membershipActive ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
            <div><h2 className={`text-sm font-bold ${membershipActive ? "text-primary" : "text-foreground"}`}>{membershipActive ? "طالب فعّال" : "طالب غير فعّال"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{membershipActive ? membershipDate ? `تنتهي عضويتك في ${membershipDate}` : "لا يوجد تاريخ انتهاء محدد" : membershipExpired && membershipDate ? `انتهت عضويتك في ${membershipDate}` : "عضويتك غير مفعّلة"}</p>
            </div>
          </div>
          <Button asChild variant={membershipActive ? "outline" : "default"} className="max-sm:w-full"><Link to="/subscription"><CreditCard />{membershipActive || membershipExpired ? "تجديد الاشتراك" : "فعّل اشتراكك الآن"}<ArrowLeft /></Link></Button>
        </section>}
      </header>
      <section className="py-6" aria-label="نشاطي">
      <h2 className="mb-3 text-sm font-bold">نشاطي</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="group flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4">
            <s.icon className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><p className="font-display text-2xl font-bold leading-none">{s.n}</p><p className="mt-2 break-words text-xs text-muted-foreground">{s.label}</p></div><ArrowLeft className="ms-auto h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
          </Link>
        ))}
      </div>
      </section>
      <form onSubmit={save} className="mt-7">
        <section className="grid gap-4 border-b pb-7 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          <div><h2 className="flex items-center gap-2 font-display text-base font-bold"><UserRound className="h-4 w-4 text-primary" />البيانات الشخصية</h2></div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">{personalFields.map((f) => <label key={f.key} className="block min-w-0 text-sm"><span className="mb-2 block text-xs font-medium text-muted-foreground">{f.label}</span><Input type={f.key === "phone" ? "tel" : "text"} autoComplete={f.key === "full_name" ? "name" : f.key === "phone" ? "tel" : "off"} inputMode={f.key === "uni_email" ? "email" : undefined} dir={f.key === "full_name" ? "rtl" : "ltr"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="h-11 bg-card" /></label>)}</div>
        </section>
        <section className="grid gap-4 py-7 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          <div><h2 className="flex items-center gap-2 font-display text-base font-bold"><GraduationCap className="h-4 w-4 text-primary" />البيانات الجامعية</h2></div>
          <div className="grid min-w-0 items-end gap-4 sm:grid-cols-2"><CityUniversitySelect city={form["city"] ?? ""} university={form["university"] ?? ""} faculty={form["faculty"] ?? ""} department={form["department"] ?? ""} onChange={(v) => setForm({ ...form, ...v })} labelClassName="mb-2 block text-xs font-medium text-muted-foreground" className="h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60" /></div>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t py-5">
          <div className="min-w-0 text-sm" aria-live="polite">{msg ? <p role={saveError ? "alert" : "status"} className={`flex items-center gap-2 ${saveError ? "text-destructive" : "text-primary"}`}>{saveError ? <CircleAlert className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}{msg}</p> : changed ? <p className="text-xs text-muted-foreground">لديك تعديلات غير محفوظة</p> : null}</div>
          <Button type="submit" disabled={saving || !p} className="ms-auto min-w-36 max-sm:w-full">{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}</Button>
        </div>
      </form>
      <footer className="mt-2 border-t py-4"><Button variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-destructive"><LogOut />تسجيل الخروج</Button></footer>
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}><DialogContent dir="rtl" className="max-w-md"><DialogHeader><DialogTitle>الصورة الشخصية</DialogTitle><DialogDescription>صورة ملفك وبطاقة الطالب</DialogDescription></DialogHeader>{p && <AvatarUpload userId={p.id} value={p.avatar_url} name={p.full_name} onChange={setAvatar} />}</DialogContent></Dialog>
      </div>
    </AppShell>
  );
}
