import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useMyProfile } from "@/lib/profile";
import { CityUniversitySelect } from "@/components/CityUniversitySelect";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Avatar } from "@/components/Avatar";
import { removeAvatar, saveAvatarPath } from "@/lib/avatar";
import { useMine } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

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
  const { data: courses = [] } = useMine("course_enrollments");
  const { data: events = [] } = useMine("event_registrations");
  const { data: deals = [] } = useMine("deal_redemptions");
  const { data: orders = [] } = useMine("orders");

  useEffect(() => {
    if (p) setForm(Object.fromEntries(fields.map((f) => [f.key, (p as any)[f.key] ?? ""])));
  }, [p]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    if (fields.some((f) => f.key !== "uni_email" && !form[f.key]?.trim())) return setMsg("يرجى تعبئة جميع الحقول");
    const { error } = await supabase.from("profiles").update(form as never).eq("id", p.id);
    setMsg(error ? "تعذّر الحفظ، حاول مجدداً" : "تم حفظ بياناتك");
    qc.invalidateQueries({ queryKey: ["my-profile"] });
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
      setMsg(e instanceof Error ? e.message : "تعذّر حفظ الصورة");
    }
  };

  const stats = [
    { label: "دوراتي", n: courses.length, to: "/courses" as const },
    { label: "فعالياتي", n: events.length, to: "/events" as const },
    { label: "عروض استخدمتها", n: deals.length, to: "/deals" as const },
    { label: "طلباتي", n: orders.length, to: "/market" as const },
  ];

  return (
    <AppShell title="ملفي">
      <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar path={p?.avatar_url} name={p?.full_name} university={p?.university} className="h-16 w-16" textClass="text-lg" />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{p?.full_name}</h2>
            <p className="text-sm opacity-80">{p?.member_code}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-2xl bg-card p-3 text-center shadow-soft">
            <p className="font-display text-2xl font-bold text-primary">{s.n}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>
      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y py-4">
        <div><h3 className="font-bold">الاشتراك الشهري</h3><p className="text-sm text-muted-foreground">100 ليرة تركية / شهر — تجربة دون دفع حقيقي</p></div>
        <Button asChild variant="outline"><Link to="/subscription"><CreditCard />تجربة الاشتراك</Link></Button>
      </section>
      <form onSubmit={save} className="mt-4 space-y-3 rounded-2xl bg-card p-4">
        <h3 className="font-bold">بياناتي الطلابية</h3>
        {p && <AvatarUpload userId={p.id} value={p.avatar_url} name={p.full_name} onChange={setAvatar} />}
        {fields.filter((f) => !["city", "university", "faculty", "department"].includes(f.key)).map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block text-muted-foreground">{f.label}</span>
            <input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded-xl border bg-background px-3 py-2" />
          </label>
        ))}
        <CityUniversitySelect city={form["city"] ?? ""} university={form["university"] ?? ""} faculty={form["faculty"] ?? ""} department={form["department"] ?? ""} onChange={(v) => setForm({ ...form, ...v })} labelClassName="mb-1 block text-muted-foreground" className="w-full rounded-xl border bg-background px-3 py-2 disabled:opacity-60" />
        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button className="w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">حفظ التعديلات</button>
      </form>
      <button onClick={signOut} className="mt-4 w-full rounded-xl border py-2 text-sm">تسجيل الخروج</button>
    </AppShell>
  );
}
